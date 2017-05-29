import { stripIndents } from 'common-tags';
import { Guild, Message, PermissionOverwrites, Permissions, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import { error } from 'winston';

import GuildConfig from '../../dataProviders/models/GuildConfig';

export default class MutedRoleCommand extends Command {
	public constructor(client: CommandoClient) {
		// tslint:disable:max-line-length
		super(client, {
			args: [
				{
					key: 'action',
					prompt: stripIndents`
					You did not specify any option:
					If you want to create a new role, respond with \`create\`.
					If you want to update the channel overwrites for the already linked role, respond with \`update\`.
					If you want to specify an already existing role, respond with a \`@Mention\` or the \`ID\`.
					If you want to remove the currently linked role, response with \`remove\`.
					If you want to display the current one, respond with something else.

					Creating a new role, chosing update or specifying a different one will automatically overwrite all channels.
					Removing a role will remove it from the config and remove the overwrites from all channels, but will not delete it from the guild.\n\u200b`,
					type: 'string',
				},
			],
			description: 'Configuration for the mute command.',
			details: stripIndents`
			Sets, creates or removes a \'Muted\' role for this guild.
			If you want to create a new role, pass \`create\` as action.
			If you want to update the channel overwrites for the already linked role, pass \`update\` as action.
			If you want to specify an already existing role, pass a \`@Mention\` or the \`ID\` as action.
			If you want to remove the already linked role, pass \`remove\` as action.
			If you want to display the current one, pass whatever else is left as action, except omitting it.

			Creating a new role, chosing update or specifying a different one will automatically overwrite all channels.
			Removing a role will remove it from the config and remove the overwrites from all channels, but will not delete it from the guild.`,
			group: 'administration',
			guildOnly: true,
			memberName: 'mutedrole',
			name: 'mutedrole',
		});
		// tslint:enable:max-line-length
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { action: string }): Promise<Message | Message[]> {
		const { id: guildID } = msg.guild;
		args.action = args.action.toLowerCase();

		const config: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID } });

		if (args.action === 'create') return this._create(msg, config);
		if (args.action === 'update') return this._update(msg, config);
		if (args.action === 'remove') return this._remove(msg, config);
		if (args.action === 'specify') return this._specify(msg, config);

		{
			const mutedRole: string = (args.action.match(/<@&(\d+)>/) || [args.action])[0];
			if (msg.guild.roles.has(mutedRole)) return this._specify(msg, config, mutedRole);
		}

		const mutedRoleID: string = config.getDataValue('mutedRole');
		const mutedRole: Role = msg.guild.roles.get(mutedRoleID);

		if (mutedRoleID && !mutedRole) {
			await config.setAndSave('mutedRole', null);
			return msg.say('The set up \'Muted\' role was not found in this guid, probably deleted, removed it from config...');
		}

		return msg.say(mutedRoleID ? `The current 'Muted' role is: \`@${mutedRole.name}\`` : 'No muted role set up.');
	}

	/**
	 * Overwrites every new TextChannel if a muted role is set up for that guild.
	 * @param {TextChannel} channel The new channel
	 * @returns {Promise<void>}
	 */
	public async newChannel(channel: TextChannel): Promise<void> {
		const config: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID: channel.guild.id } });
		if (!config.mutedRole) return;
		const mutedRole: Role = channel.guild.roles.get(config.mutedRole);
		if (!mutedRole) {
			config.setAndSave('mutedRole', null);
			return;
		}

		channel.overwritePermissions(mutedRole, { SEND_MESSAGES: false }).catch(error);
	}

	/**
	 * Creates a new role if no one is present
	 * @param {CommandMessage} msg The incoming message
	 * @param {GuildConfig} config The config to read from and write to
	 * @returns {Promise<void>}
	 */
	private async _create(msg: CommandMessage, config: GuildConfig): Promise<Message | Message[]> {
		if (msg.guild.roles.has(config.mutedRole)) {
			return msg.say(stripIndents`
			There is already a role specified in the config.
      		If you want to create a new role you have to \`remove\` the old first.
      		Doing that only removes the overwrites and the config entry, the role itself wont be touched.
      		If you want to specify a different role you can specify that with a \`@Mention\` or via the ID.`);
		}
		const statusmessage: Message = await msg.say('Creating role...') as Message;

		const roleID: string = await msg.guild.createRole({ name: 'Muted', permissions: [] }).then((role: Role) => role.id);
		await config.setAndSave('mutedRole', roleID);

		await statusmessage.edit('Overwriting channel permissions, this may take a while...').catch(() => null);
		const failed: number = await this._overwrite(msg.guild, roleID);

		return statusmessage.edit(stripIndents`
			Role created${failed
				? stripIndents`
					, but failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      				You might want to check if that is okay for you, or fix it yourself if not.`
				: ' and all overwrites set up!'}
			Also you maybe want to move the role up, be sure to not move the role higher than my highest role!`,
		).catch(() => null);
	}

	/**
	 * Updates the current role. Overwrites the permission in all channels.
	 * Or removes it from the config if no longer present.
	 * @param {CommandMessage} msg The incoming message
	 * @param {GuildConfig} config The config to update the role if necessary
	 * @returns {Promise<void>}
	 */
	private async _update(msg: CommandMessage, config: GuildConfig): Promise<Message | Message[]> {
		if (!config.mutedRole) {
			return msg.say('There is no \'Muted\' role set up!');
		}

		if (!msg.guild.roles.has(config.mutedRole)) {
			await config.setAndSave('mutedRole', null);
			return msg.say('The role specified in the config could not be found, removing it from config...');
		}

		const statusMessage: Message = await msg.say('Overwriting channel permissions, this may take a while...') as Message;
		const failed: number = await this._overwrite(msg.guild, config.mutedRole, false);

		return statusMessage.edit(
			failed
				? stripIndents`
					Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      				You might want to check if that is okay for you, or fix it yourself if not.`
				: 'All overwrites set up!',
		).catch(() => null);
	}

	/**
	 * Sets the muted role.
	 * @param {CommandMessage} msg The incoming message.
	 * @param {GuildConfig} config The config to update the role and remove old overwrites from if possible
	 * @param {string} role The new role to update the config and overwrites with
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _specify(msg: CommandMessage, config: GuildConfig, role: string = ''): Promise<Message | Message[]> {
		let statusMessage: Message;

		if (msg.guild.roles.has(config.mutedRole)) {
			if (role === config.mutedRole) {
				return msg.say(stripIndents`This is the current \'Muted\' role.
				To update the overwrites please use the \`update\` option.`);
			}
			statusMessage = await msg.say('Removing old overwrites, this may take a while...') as Message;
			await this._overwrite(msg.guild, config.mutedRole, true);
		}

		if (statusMessage) {
			statusMessage = await statusMessage
				.edit('Overwriting channel permissions for new role, this may take a while...')
				.catch(() => msg.say('Overwriting channel permissions for new role, this may take a while...')) as Message;
		}

		const failed: number = await this._overwrite(msg.guild, config.mutedRole);
		await config.setAndSave('mutedRole', role);

		return statusMessage.edit(
			failed
				? stripIndents`
					Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      				You might want to check if that is okay for you, or fix it yourself if not.`
				: `All overwrites set for \`@${msg.guild.roles.get(role).name}\`!`,
		).catch(() => null);
	}

	/**
	 * Removes the current muted role and removes overwrites if possible.
	 * The role itself wont be changed, just the overwrites and the entry in the config.
	 * @param {CommandMessage} msg The incoming message
	 * @param {GuildConfig} config The config to remove the role from
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _remove(msg: CommandMessage, config: GuildConfig): Promise<Message | Message[]> {
		if (!config.mutedRole) {
			return msg.say('There is no \'Muted\' role set up to remove!');
		}

		if (!msg.guild.roles.has(config.mutedRole)) {
			await config.setAndSave('mutedRole', null);
			return msg.say('Removed the deleted \'Muted\' role from the config.');
		}

		const failed: number = await this._overwrite(msg.guild, config.mutedRole, true);

		await config.setAndSave('mutedRole', null);

		return msg.say(
			failed	// tslint:disable-next-line:max-line-length
				? stripIndents`
					Failed removing \`${failed}/${msg.guild.channels.size}\` channel overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\`!
      				You might want to check if that is okay for you, or fix it yourself if not.`
				: stripIndents`
					Removed all overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\` and removed it from config!
					The role itself remains untouched.`,
		).catch(() => null);
	}

	/**
	 * Overwrites channel permissions or removes them.
	 * @param {Guild} guild The guild object
	 * @param {string} role The role to overwrite with or remove
	 * @param {boolean} remove Whether remove or overwrite the channel permissions for that role
	 * @returns {Promise<number>} The number of failed overwrites
	 * @private
	 */
	private async _overwrite(guild: Guild, role: string | Role, remove: boolean = false): Promise<number> {
		role = guild.roles.get(role as string);
		if (!role) throw new FriendlyError('the specified role is invalid!');
		let failed: number = 0;
		for (const channel of guild.channels.values()) {
			if (channel.type !== 'text') continue;
			const overwrites: PermissionOverwrites = channel.permissionOverwrites.get(role.id);
			if (remove) {
				if (overwrites) await overwrites.delete().catch(() => failed++);
				continue;
			}
			if (overwrites && new Permissions(overwrites.deny).has('SEND_MESSAGES')) continue;
			await channel.overwritePermissions(role, { SEND_MESSAGES: false })
				.catch(() => failed++);
		}
		return failed;
	}
}
