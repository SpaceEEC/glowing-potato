import { DiscordAPIError, TextChannel, User } from 'discord.js';
import { join } from 'path';
import { Client as YAMDBFClient, Guild, ListenerUtil, logger, Logger, LogLevel, Message, Providers } from 'yamdbf';

import { Config } from '../types/config';
import { RavenUtil } from '../util/RavenUtil';
import { Util } from '../util/Util';
import { EventHandlers } from './EventHandlers';
import { MusicPlayer } from './MusicPlayer';
import { RichEmbed } from './RichEmbed';

const { on, once } = ListenerUtil;

const { database, logLevel, token, ownerID }: Config = require('../../config.json');
const { version }: { version: string } = require('../../package.json');

/**
 * The central client for this bot
 */
export class Client extends YAMDBFClient
{
	/**
	 * Reference to the logger singleton
	 * @readonly
	 */
	@logger public readonly logger: Logger;
	/**
	 * Music player of the client which handles all voice related commands and logic
	 * @readonly
	 */
	public readonly musicPlayer: MusicPlayer;

	/**
	 * Event handlers
	 * @readonly
	 * @private
	 */
	private readonly _eventHandlers: EventHandlers;

	/**
	 * Instantiates the client
	 * Is not meant to be instantiated multiple times
	 */
	public constructor()
	{
		super({
			commandsDir: join(__dirname, '..', 'commands'),
			name: 'spacebot',
			owner: [ownerID],
			pause: true,
			provider: Providers.PostgresProvider(database),
			token,
			unknownCommandError: false,
			version,
		});

		Util.init(this);
		RavenUtil.init();

		this.musicPlayer = new MusicPlayer(this);

		this._eventHandlers = new EventHandlers(this);
	}

	/**
	 * Handles things that should be done before clientReady is being fired.
	 * @returns {Promise<void>}
	 * @private
	 */
	@once('pause')
	public async _onPause(): Promise<void>
	{
		await this.setDefaultSetting('prefix', '$');
		this.emit('continue');
	}

	/**
	 * Emitted whenever a user has been added or remove from the blacklist.
	 * @param {User} user The relevant user
	 * @param {boolean} global Whether this is a global action
	 * @returns {void}
	 * @private
	 */
	@on('blackListAdd')
	@on('blackListRemove', true)
	public _onBlacklist(user: User, global: boolean, remove: boolean): void
	{
		this.logger.info(remove ? 'Whitelist' : 'Blacklist', 'User:', user.tag, 'Global:', global ? 'yes' : 'no');
	}

	// pretty much a copy from
	// https://github.com/zajrik/modbot/blob/master/src/lib/ModClient.ts#L58
	/**
	 * Emitted whenever a command has been executed.
	 * @param {string} name Name of the executed command
	 * @param {any[]} args
	 * @param {number} execTime In ms
	 * @param {Message} message
	 * @returns {void}
	 * @private
	 */
	@on('command')
	public _onCommand(name: string, args: any[], execTime: number, message: Message): void
	{
		// ingore dev environment
		if (logLevel === LogLevel.DEBUG) return;

		const logChannel: TextChannel = this.channels.get('334843191545036800') as TextChannel;

		const { author, channel, content, guild }: Message = message;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xb4e0e0)
			.setAuthor(`${author.tag} (${author.id})`, author.displayAvatarURL);
		if (guild)
		{
			embed.addField('Guild', `${guild.name} (${guild.id})`, true)
				.addField('Channel', `#${(channel as TextChannel).name} (${channel.id})`)
				.setThumbnail(guild.iconURL);
		}
		embed.addField('Exec time', `${execTime.toFixed(2)}ms`, true)
			.addField('Command content', content)
			.setFooter(channel.type.toUpperCase(), this.user.displayAvatarURL)
			.setTimestamp();

		logChannel.send({ embed }).catch(() => null);
	}

	/**
	 * Logs guildCreate and guildDelete events.
	 * @param {Guild} guild The relevant guild
	 * @param {boolean} left Whether this guild has been left or joined
	 * @returns {Promise<void>}
	 * @private
	 */
	@on('guildCreate')
	@on('guildDelete', true)
	public _onGuild(guild: Guild, left: boolean): Promise<void>
	{
		this.logger.info(
			left ? 'GuildDelete' : 'GuildCreate',
			`${left ? 'Left' : 'Joined'} ${guild.name} (${guild.id})`,
		);

		// ingore dev environment
		if (logLevel === LogLevel.DEBUG) return;

		const channel: TextChannel = this.channels.get('334820476557852683') as TextChannel;

		const embed: RichEmbed = new RichEmbed()
			.setColor(left ? 0xFF0000 : 0x00FF00)
			.setTitle(`${left ? 'Left' : 'Joined'} a guild`)
			.setThumbnail(guild.iconURL)
			.setDescription([
				`Guild: ${guild.name} (${guild.id})`,
				`Member count: ${guild.memberCount}`,
				`Owner: ${guild.owner} - ${this.users.get(guild.ownerID).tag} (${guild.ownerID})`,
			])
			.setFooter(`current guild count: ${this.guilds.size}`)
			.setTimestamp();

		return channel.send({ embed })
			.then(() => undefined)
			.catch((error: DiscordAPIError) =>
			{
				RavenUtil.error(`${left ? 'guildDelete' : 'GuildCreate'} | send`, error);
			});
	}

	/**
	 * Logs a disconnect and exits the process.
	 * @param {CloseEvent} event WebSocket close event
	 * @returns {Promise<void>} never resolves though
	 * @private
	 */
	@once('disconnect')
	public async _onDisconnect(event: any): Promise<void>
	{
		await this.logger.warn('Disconnect', 'Fatal disconnect:', event.code, event.reason);
		process.exit();
	}

	/**
	 * Discord.js' ready event.
	 * @returns {void}
	 * @private
	 */
	@once('ready')
	public _onceReady(): void
	{
		(this as any).ws.connection.on('close',
			(event: any) =>
			{
				this.logger.warn('discord.js | disconnect',
					'Code:',
					event.code,
					'; Reason :',
					event.reason || 'No reason',
				);
			},
		);
	}

	/**
	 * Discord.js' debug event.
	 * @param {string} message
	 * @returns {void}
	 * @private
	 */
	@on('debug')
	public _onDebug(message: string): void
	{
		if (message.startsWith('Authenticated using token')
			|| message.startsWith('[ws] [connection] Heartbeat acknowledged,')
			|| message === '[ws] [connection] Sending a heartbeat')
		{
			return;
		}

		this.logger.debug('discord.js', message);
	}

	/**
	 * Discord.js' warn event.
	 * @param {string} message
	 * @returns {void}
	 * @private
	 */
	@on('warn')
	public _onWarn(message: string): void
	{
		this.logger.warn('discord.js', message);
	}

	/**
	 * Discord.js' error event.
	 * @param {Error} error
	 * @returns {void}
	 * @private
	 */
	@on('error')
	public _onError(error: Error): void
	{
		RavenUtil.error('discord.js', error);
	}
}
