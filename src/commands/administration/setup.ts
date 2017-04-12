import { stripIndents } from 'common-tags';
import { Collection, Message, Role, TextChannel } from 'discord.js';
import { ArgumentCollector, ArgumentCollectorResult, ArgumentInfo, Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

import GuildConfig from '../../dataProviders/models/GuildConfig';
import Util from '../../util/util';

export default class SetupCommand extends Command {
	private util: Util;
	constructor(client: CommandoClient) {
		super(client, {
			name: 'setup',
			group: 'administration',
			memberName: 'setup',
			description: 'Guild config setup.',
			details: 'Sets up the configuration for this guild.',
			guildOnly: true,
		});
		this.util = new Util(client);
	}

	public hasPermission(msg: CommandMessage): boolean {
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { role: Role | string, added: boolean }): Promise<Message | Message[]> {
		let note: string = '**Setup:**\n';
		if (this.client.provider.get(msg.guild.id, 'setup', false)) {
			note = '**Note:** The setup already has been run\n\n';
		}

		const noticeMessage: Message = await msg.say(`${note}You can exit whenever you want by typing \`cancel\`.\nChanged settings will be saved.`) as Message;
		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID: msg.guild.id } }) as any)[0].dataValues;

		const statusMessage: Message = await msg.say('**Current Configuration:** General - Roles') as Message;
		let timeout: number = 30000;
		const result: [string, boolean][] = [];

		try {
			result.push(['**General - Roles**\n', undefined]);
			result.push(['Admin role', await this.adminRole(msg)]);
			result.push(['Mod role', await this.modRole(msg)]);

			await statusMessage.edit('**Current Configuration: General - Messages**');
			result.push(['**General - Messages**\n', undefined]);

			result.push(['Join message', await this.joinMessage(msg, config)]);
			result.push(['Leave message', await this.leaveMessage(msg, config)]);

			await statusMessage.edit('**Current Configuration: General - Channels**');
			result.push(['**General - Channels**\n', undefined]);

			result.push(['Announcement channel', await this.anChannel(msg, config)]);
			result.push(['Log channel', await this.logChannel(msg, config)]);
			result.push(['Voicelog channel', await this.vlogChannel(msg, config)]);

			await statusMessage.edit('**Current Configuration: Music**');
			result.push(['**Music**\n', undefined]);

			result.push(['DJ role', await this.djRole(msg)]);
			result.push(['DJ channel', await this.djChannel(msg)]);

			await this.client.provider.set(msg.guild.id, 'setup', true);

			await statusMessage.edit(stripIndents`**Current configuration's status:**
			${this.map(result)}`).catch(() => {
				msg.say(stripIndents`**Current configuration's status:**
			${this.map(result)}`).catch(() => null);
			});

			return await msg.say(stripIndents`**Configuration complete.**

			You can set up a role for the \`mute\` command, see the \`mutedrole\` help for more informations.
			You can manually blacklist and unblacklist channels and members with \`blacklist <member|channel>\`.`);
		} catch (err) {
			timeout = 0;
			if (!(err instanceof FriendlyError)) GuildConfig.upsert(config);
			throw err;
		} finally {
			noticeMessage.delete().catch(() => null);
			statusMessage.delete(timeout).catch(() => null);
		}

	}

	/* Configuration: General - Roles */

	/**
	 * Maybe sets a new admin role, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async adminRole(msg: CommandMessage): Promise<boolean> {
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).filter((r: string) => msg.guild.roles.has(r));

		let prompt: string = stripIndents`**Admin Roles:**

		Member with an admin role can use administration commands, for example this configuration.
		They also can use moderation commands and bypass music restrictions, such as channels and roles.`;
		prompt += roles.length
			? stripIndents`\n\nCurrent admin role(s): ${roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ')}
			Do you want to overwrite it/them with a new one?\n`
			: '\n\nDo you want to set an admin role now? You can always add or remove them later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(roles.length);

		const adminRole: Role = await this.util.prompt<Role>(msg, { key: 'key', prompt: 'which role shall it be?', type: 'role' });

		if (!adminRole) return Boolean(roles.length);
		return this.client.provider.set(msg.guild.id, 'adminRoles', [adminRole.id]);
	}

	/**
	 * Maybe sets a new mod role, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async modRole(msg: CommandMessage): Promise<boolean> {
		const roles: string[] = this.client.provider.get(msg.guild.id, 'modRoles', []).filter((r: string) => msg.guild.roles.has(r));

		let prompt: string = stripIndents`**Mod Roles:**

		Member with an mod role can use moderation commands, for example muting someone.
		They also bypass music restrictions, such as channels and roles.`;
		prompt += roles.length
			? stripIndents`\n\nCurrent mod role(s): ${roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ')}
			Do you want to overwrite it/them with a new one?\n`
			: '\n\nDo you want to set a mod role now? You can always add or remove them later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(roles.length);

		const modRole: Role = await this.util.prompt<Role>(msg, { key: 'key', prompt: 'which role shall it be?', type: 'role' });

		if (!modRole) return Boolean(roles.length);
		return this.client.provider.set(msg.guild.id, 'modRoles', [modRole.id]);
	}

	/* Configuration: General - Messages */

	/**
	 * Maybe sets a new join message, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {GuildConfig} config - GuildConfig to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async joinMessage(msg: CommandMessage, config: GuildConfig): Promise<boolean> {
		let prompt: string = '**Join Message:**\nThe join message will be sent to the announcement- and logchannel, if these are set up.';
		prompt += config.joinMessage
			? `\n\nCurrent join message is: \`${config.joinMessage}\`, do you like to set a new?\n`
			: '\n\nDo you want to set a join message now? You can always do that later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(config.joinMessage);

		const joinMessage: string = await this.util.prompt<string>(msg, { key: 'key', prompt: 'which message shall be sent whenever a new member joins this guild?\nYou can use `:member:` and :guild` as placeholder.', type: 'string' });

		if (!joinMessage) return Boolean(config.joinMessage);

		config.joinMessage = joinMessage;
		return GuildConfig.upsert(config);
	}

	/**
	 * Maybe sets a new leave message, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {GuildConfig} config - GuildConfig to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async leaveMessage(msg: CommandMessage, config: GuildConfig): Promise<boolean> {
		let prompt: string = stripIndents`**Leave Message:**
		
		The leave message will be sent to the announcement- and logchannel, if these are set up.`;
		prompt += config.leaveMessage
			? `\n\nCurrent leave message is: \`${config.leaveMessage}\`, do you like to set a new?\n`
			: '\n\nDo you want to set a leave message now? You can always do that later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(config.leaveMessage);

		const leaveMessage: string = await this.util.prompt<string>(msg, { key: 'key', prompt: 'which message shall be sent whenever a new member joins this guild?\nYou can use `:member:` and :guild` as placeholder.', type: 'string' });

		if (!leaveMessage) return Boolean(config.leaveMessage);

		config.leaveMessage = leaveMessage;
		return GuildConfig.upsert(config);
	}

	/* Configuration: General - Channels */

	/**
	 * Maybe sets a new announcement channel, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {GuildConfig} config - GuildConfig to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async anChannel(msg: CommandMessage, config: GuildConfig): Promise<boolean> {
		let prompt: string = stripIndents`**Announcement Channel:**
		
		Join- and leave messages will be sent here.`;
		prompt += config.anChannel && msg.guild.channels.has(config.anChannel)
			? `\n\nThe current announcement channel is: <#${config.anChannel}>\n`
			: '\n\nWould you like to set up an announcement channel now? You can always do that later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(config.anChannel);

		const anChannel: TextChannel = await this.util.prompt<TextChannel>(msg, { key: 'key', prompt: 'which channel would you like to set as announcement channel?\n', type: 'channel' });

		if (!anChannel || anChannel.type !== 'text') return Boolean(config.anChannel);

		config.anChannel = anChannel.id;
		return GuildConfig.upsert(config);
	}

	/**
	 * Maybe sets a new log channel, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {GuildConfig} config - GuildConfig to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async logChannel(msg: CommandMessage, config: GuildConfig): Promise<boolean> {
		let prompt: string = stripIndents`**Log Channel:**
		
		All sort of stuff will be logged here.`;
		prompt += config.logChannel && msg.guild.channels.has(config.logChannel)
			? `\n\nThe current log channel is: <#${config.logChannel}>\n`
			: '\n\nWould you like to set up an log channel now? You can always do that later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(config.logChannel);

		const logChannel: TextChannel = await this.util.prompt<TextChannel>(msg, { key: 'key', prompt: 'which channel would you like to set as log channel?\n', type: 'channel' });

		if (!logChannel || logChannel.type !== 'text') return Boolean(config.logChannel);

		config.logChannel = logChannel.id;
		return GuildConfig.upsert(config);
	}

	/**
	 * Maybe sets a new voicelog channel, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {GuildConfig} config - GuildConfig to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async vlogChannel(msg: CommandMessage, config: GuildConfig): Promise<boolean> {
		let prompt: string = stripIndents`**Voicelog Channel:**
		
		Member movements in the voice channels will be logged here, if set.`;
		prompt += config.vlogChannel && msg.guild.channels.has(config.vlogChannel)
			? stripIndents`\n\nThe current voicelog channel is: <#${config.vlogChannel}>
			Would you like to set a new one?\n`
			: '\n\nWould you like to set up a voicelog channel now? You can always do that later on manually.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(config.vlogChannel);

		const vlogChannel: TextChannel = await this.util.prompt<TextChannel>(msg, { key: 'key', prompt: 'which channel would you like to set as voicelog channel?\n', type: 'channel' });

		if (!vlogChannel || vlogChannel.type !== 'text') return Boolean(config.vlogChannel);

		config.vlogChannel = vlogChannel.id;
		return GuildConfig.upsert(config);
	}

	/* Configuration: Music */

	/**
	 * Maybe sets a new dj role, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async djRole(msg: CommandMessage): Promise<boolean> {
		const roles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []).filter((r: string) => msg.guild.roles.has(r));

		let prompt: string = stripIndents`**DJ Roles:**
		
		When set, only member of a DJ role can use commands to control music.
		Note that mods and higher bypass this.`;
		prompt += roles.length
			? stripIndents`\n\nCurrent DJ role(s): ${roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ')}
			Would you like to overwrite them with a new role?\n`
			: '\n\nDo you want to set a role now? You can always add or remove roles later on.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(roles.length);

		const djRole: Role = await this.util.prompt<Role>(msg, { key: 'key', prompt: 'which role do you want to set as DJ role?\n', type: 'role' });

		if (!djRole) return Boolean(roles.length);

		return this.client.provider.set(msg.guild.id, 'djRoles', [djRole.id]);
	}

	/**
	 * Maybe sets a new dj channel, depending on user input.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async djChannel(msg: CommandMessage): Promise<boolean> {
		const channels: string[] = this.client.provider.get(msg.guild.id, 'djChannels', []).filter((c: string) => msg.guild.channels.has(c) && msg.guild.channels.get(c).type === 'text');

		let prompt: string = stripIndents`**DJ/Music Channels:**
		
		When set, member of one of the DJ roles will only be able to use music controlling commands in this channels.
		Note that mods and higher bypass this.`;
		prompt += channels.length
			? stripIndents`\n\nCurrent DJ channel(s): ${channels.map((r: string) => `\`@${msg.guild.channels.get(r).name}\``).join(', ')}
			Would you like to overwrite them with a new channel?\n`
			: '\n\nDo you want to specify a channel now? You can always add or remove channels later on.\n';

		if (!(await this.util.prompt<boolean>(msg, { key: 'key', prompt, type: 'boolean' }))) return Boolean(channels.length);

		const djChannel: TextChannel = await this.util.prompt<TextChannel>(msg, { key: 'key', prompt: 'which channel do you want to set as DJ channel?\n', type: 'channel' });

		if (djChannel.type !== 'text') return Boolean(channels.length);
		return this.client.provider.set(msg.guild.id, 'djChannels', [djChannel.id]);
	}

	private map(input: [string, boolean][]): string {
		const response: string[] = [];
		for (const [option, valid] of input) {
			if (valid === undefined) response.push(option);
			else response.push(`${option}: ${valid ? '✅' : '❌'}`);
		}
		return response.join('\n');
	}
};
