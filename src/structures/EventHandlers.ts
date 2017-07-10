import { DiscordAPIError, GuildChannel, GuildMember, TextChannel } from 'discord.js';
import { inspect } from 'util';
import { Guild, GuildStorage, ListenerUtil } from 'yamdbf/bin';

import { GuildConfigChannels, GuildConfigStrings } from '../types/GuildConfigKeys';
import { Client } from './Client';
import { RichEmbed } from './RichEmbed';

const { on, once, registerListeners } = ListenerUtil;

export class EventHandlers
{
	private _client: Client;
	public constructor(client: Client)
	{
		this._client = client;
		registerListeners(this._client, this);
	}

	@once('ready')
	public _onceReady(): void
	{
		(this._client as any).ws.connection.on('close',
			(event: any) =>
			{
				this._client.logger.warn('discord.js',
					'[WS] [connection] disconnected:',
					event.code,
					':',
					event.reason || 'No reason',
				);
			},
		);
	}

	@on('debug')
	public _onDebug(message: string): void
	{
		if (message.startsWith('Authenticated using token')
			|| message.startsWith('[ws] [connection] Heartbeat acknowledged,')
			|| message === '[ws] [connection] Sending a heartbeat')
		{
			return;
		}

		this._client.logger.debug('discord.js', message);
	}

	@once('disconnect')
	public async _onDisconnect(event: any): Promise<void>
	{
		await this._client.logger.info('Disconnect', 'Fatal disconnect:', event.code, event.reason);
		process.exit();
	}

	@on('warn')
	public _onWarn(message: string): void
	{
		this._client.logger.warn('discord.js', message);
	}

	@on('error')
	public _onError(error: Error): void
	{
		this._client.logger.error('discord.js', inspect(error, true, Infinity, true));
	}

	@on('guildMemberAdd')
	public async _onGuildMemberAdd(member: GuildMember): Promise<void>
	{
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(member.guild.id);

		const [
			joinMessage,
			logChannel,
			anChannel,
		]: string[] = await Promise.all([
			guildStorage.get(GuildConfigStrings.JOINMESSAGE),
			guildStorage.get(GuildConfigChannels.LOGCHANNEL),
			guildStorage.get(GuildConfigChannels.ANCHANNEL),
		]);

		if (!joinMessage) return;

		const guildMe: GuildMember = member.guild.me || await member.guild.fetchMember(this._client.user.id);
		const message: string = joinMessage
			.replace(/:member:/g, `\`@${member.user.tag}\``)
			.replace(/:guild:/g, member.guild.name);

		if (logChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(logChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.LOGCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Join:LogChannel', error.name, error.code.toString(), error.message);
					});
			}
		}

		if (anChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(anChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.ANCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Join:AnChannel', error.name, error.code.toString(), error.message);
					});
			}
		}
	}

	@on('guildMemberRemove')
	public async _onGuildMemberRemove(member: GuildMember): Promise<void>
	{
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(member.guild.id);

		const [
			leaveMessage,
			logChannel,
			anChannel,
		]: string[] = await Promise.all([
			guildStorage.get(GuildConfigStrings.LEAVEMESSAGE),
			guildStorage.get(GuildConfigChannels.LOGCHANNEL),
			guildStorage.get(GuildConfigChannels.ANCHANNEL),
		]);

		if (!leaveMessage) return;

		const guildMe: GuildMember = member.guild.me || await member.guild.fetchMember(this._client.user.id);
		const message: string = leaveMessage
			.replace(/:member:/g, `\`@${member.user.tag}\``)
			.replace(/:guild:/g, member.guild.name);

		if (logChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(logChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.LOGCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Leave:LogChannel', error.name, error.code.toString(), error.message);
					});
			}
		}

		if (anChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(anChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.ANCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Leave:AnChannel', error.name, error.code.toString(), error.message);
					});
			}
		}
	}

	@on('voiceStateUpdate')
	public async _onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void>
	{
		if (newMember.user.bot) return;
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(newMember.guild.id);

		const vlogChannel: string = await guildStorage.get(GuildConfigChannels.VLOGCHANNEL);

		if (!vlogChannel) return;

		const guildMe: GuildMember = newMember.guild.me || await newMember.guild.fetchMember(this._client.user.id);
		const channel: GuildChannel = newMember.guild.channels.get(vlogChannel);

		if (!channel || !(channel instanceof TextChannel))
		{
			await guildStorage.remove(GuildConfigChannels.VLOGCHANNEL);
		}
		else if (channel.permissionsFor(guildMe).has(['SEND_MESSAGES', 'EMBED_LINKS']))
		{
			if (oldMember.voiceChannel !== newMember.voiceChannel)
			{
				const embed: RichEmbed = new RichEmbed()
					.setAuthor(newMember.displayName, newMember.user.displayAvatarURL, newMember.user.displayAvatarURL)
					.setTimestamp();

				if (!newMember.voiceChannel)
				{
					embed
						.setColor(0xFF4500)
						.setDescription(`${newMember} disconnected from ${oldMember.voiceChannel.name}.`);
				}
				else if (!oldMember.voiceChannel)
				{
					embed
						.setColor(0x7CFC00)
						.setDescription(`${newMember} connected to ${newMember.voiceChannel.name}.`);
				}
				else
				{
					embed
						.setColor(3447003)
						.setDescription(`${newMember} went from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}.`);
				}

				channel.send({ embed })
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('VLOG', error.name, error.code.toString(), error.message);
					});
			}
		}
	}

	@on('guildCreate')
	@on('guildDelete', true)
	public _onGuild(guild: Guild, left: boolean): void
	{
		this._client.logger.info(
			left ? 'GuildDelete' : 'GuildCreate',
			`${left ? 'Left' : 'Joined'} ${guild.name} (${guild.id})`,
		);
	}

}
