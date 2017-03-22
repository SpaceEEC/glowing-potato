import { stripIndents } from 'common-tags';
import { Collection, Guild, GuildChannel, Message, PermissionOverwrites, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import { GuildConfig } from '../../dataProviders/models/GuildConfig';

export default class MutedRoleCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'mutedrole',
			group: 'adminstuff',
			memberName: 'mutedrole',
			description: 'Sets, creates or removes a \'Muted\' role for this guild.',
			details: stripIndents`If you want to create a new role, pass \`create\` as action.
          If you want to update the channel overwrites for the already linked role, pass \`update\` as action.
          If you want to specify an already existing role, pass a \`@Mention\` or the \`ID\` as action.
          If you want to remove the already linked role, pass \`remove\` as action.
          If you want to display the current one, pass whatever else is left as action, except omitting it.
          
          Creating a new role, chosing update or specifying a different one will automatically overwrite all channels.
          Removing a role will remove it from the config and remove the overwrites from all channels, but will not delete it from the guild.`,
			guildOnly: true,
			args: [
				{
					key: 'action',
					prompt: stripIndents`You did not specify any option:
          If you want to create a new role, respond with \`create\`.
          If you want to update the channel overwrites for the already linked role, respond with \`update\`.
          If you want to specify an already existing role, respond with a \`@Mention\` or the \`ID\`.
          If you want to remove the already linked role, response with \`remove\`.
          If you want to display the current one, respond with whatever you want, **except** \`cancel\`.
          
          Creating a new role, chosing update or specifying a different one will automatically overwrite all channels.
          Removing a role will remove it from the config and remove the overwrites from all channels, but will not delete it from the guild.\n\u200b`,
					type: 'string',
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { action: string }): Promise<Message | Message[]> {
		const { id: guildID } = msg.guild;
		args.action = args.action.toLowerCase();

		let config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID } }) as any)[0].dataValues;

		// there must be a better way
		if (['create', 'update', 'remove', 'specify'].includes(args.action)) {
			if (args.action === 'create') config = await this.create(msg, config);
			else if (args.action === 'update') config = await this.update(msg, config);
			else if (args.action === 'remove') config = await this.remove(msg, config);
			else if (args.action === 'specify') config = await this.specify(msg, config);
			if (config) await GuildConfig.upsert(config);
			return;
		}

		{
			let mutedRole: string[] | string = args.action.match(/<@&(\d+)>/);
			mutedRole = mutedRole instanceof Array ? mutedRole[0] : args.action;
			if (msg.guild.roles.has(mutedRole)) {
				config = await this.specify(msg, config, mutedRole);
				if (config) await GuildConfig.upsert(config);
				return;
			}
		}

		const mutedRole: Role = msg.guild.roles.get(config.mutedRole);

		if (config.mutedRole && !mutedRole) {
			msg.say('The set up muted role was not found, probably deleted, removing it from config...');
			config.mutedRole = null;
			await GuildConfig.upsert(config);
			return;
		}

		msg.say(config.mutedRole ? `The current muted role is \`@${mutedRole.name}\`` : 'No muted role set up.');
	}

	/**
	 * Creates a new role if no one is present
	 * @param {Message} msg The incoming message.
	 * @param {GuildConfig} config The config to read from and write to.
	 * @returns {GuildConfig|null} Returns the config if changes where made.
	 */
	private async create(msg: CommandMessage, config: GuildConfig): Promise<GuildConfig | null> {
		if (config.mutedRole && msg.guild.roles.has(config.mutedRole)) {
			msg.say(stripIndents`There is already a role specified in the config.
      If you want to create a new role you have to \`remove\` the old first.
      Doing that only removes the overwrites and the config entry, the role itself wont be touched.
      If you want to specify a different role you can specify that with a \`@Mention\` or via the ID.`);
			return null;
		}
		const statusmessage: Message = (await msg.say('Creating role...') as Message);

		const roleID: string = (await msg.guild.createRole({ name: 'Muted', permissions: [] })).id;
		config.mutedRole = roleID;

		await statusmessage.edit('Overwriting channel permissions, this may take a while...');
		const failed: number = await this.overwrite(msg.guild, roleID);

		statusmessage.edit(stripIndents`Role created${failed
			? stripIndents`, but failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
			: ' and all overwrites set up!'}
			Also you maybe want to move the role up, be sure not to move the role higher than my highest role!`);
		return config;
	}

	/**
	 * Updates the current role. Overwrites the permission in all channels.
	 * Or removes it from the config if no longer present.
	 * @param {message} msg The incoming message.
	 * @param {GuildConfig} config The config to update the role if necessary.
	 * @returns {GuildConfig|null} Returns the config if changes where made.
	 */
	private async update(msg: CommandMessage, config: GuildConfig): Promise<GuildConfig | null> {
		if (!config.mutedRole) {
			msg.say('There is no muted role set up!');
			return null;
		}
		if (!msg.guild.roles.has(config.mutedRole)) {
			msg.say('The role specified in the config could not be found, removing it from config...');
			config.mutedRole = null;
			return config;
		}
		const statusMessage: Message = (await msg.say('Overwriting channel permissions, this may take a while...') as Message);
		const failed: number = await this.overwrite(msg.guild, config.mutedRole, false);

		statusMessage.edit(stripIndents`${failed
			? stripIndents`Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
			: 'All overwrites set up!'}`);
		return null;
	}

	/**
	 * Updates the muted role or sets it.
	 * @param {Message} msg The incoming message.
	 * @param {GuildConfig} config The config to update the role and remove old overwrites from if possible.
	 * @param {string} role The new role to update the config and overwrites with.
	 * @returns {GuildConfig|null} Returns the config if changes where made.
	 */
	private async specify(msg: CommandMessage, config: GuildConfig, role: string = ''): Promise<GuildConfig | null> {
		let statusMessage: Message;
		if (config.mutedRole && msg.guild.roles.has(config.mutedRole)) {
			if (role === config.mutedRole) {
				msg.say(stripIndents`This is the current muted role.
				To update the overwrites please use the \`update\` option.`);
				return null;
			}
			statusMessage = (await msg.say('Removing old overwrites, this may take a while...') as Message);
			await this.overwrite(msg.guild, config.mutedRole, true);
		}

		await statusMessage.edit('Overwriting channel permissions for new role, this may take a while...');
		const failed: number = await this.overwrite(msg.guild, config.mutedRole);
		config.mutedRole = role;

		statusMessage.edit(stripIndents`${failed
			? stripIndents`Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
			: `All overwrites set for \`@${msg.guild.roles.get(role).name}\`!`}`);
		return config;
	}

	/**
	 * Removes the current muted role and removes overwrites if possible.
	 * The role itself wont be changed, just the overwrites and the entry in the config.
	 * @param {Message} msg The incoming message.
	 * @param {GuildConfig} config The config to remove the role from.
	 * @returns {GuildConfig|null} Returns the config if changes where made.
	 */
	private async remove(msg: CommandMessage, config: GuildConfig): Promise<GuildConfig | null> {
		if (!config.mutedRole) {
			msg.say('There is no muted role set up to remove!');
			return null;
		}
		if (!msg.guild.roles.has(config.mutedRole)) {
			msg.say('Removed the deleted muted role from the config.');
			config.mutedRole = null;
			return config;
		}
		const failed: number = await this.overwrite(msg.guild, config.mutedRole, true);

		msg.say(stripIndents`${failed
			? stripIndents`Failed removing \`${failed}/${msg.guild.channels.size}\` channel overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\`!
      			You might want to check if that is okay for you, or fix it yourself if not.`
			: stripIndents`Removed all overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\` and removed it from config!`}
				The role itself remains untouched.`);

		config.mutedRole = null;
		return config;
	}

	/**
	 * Overwrites channel permissions or removes them.
	 * @param {Guild} guild The guild object.
	 * @param {Role|String} role The role to overwrite with or remove.
	 * @param {Boolean} remove Whether remove or overwrite the channel permissions for that role.
	 * @returns {Number} The number of failed overwrites.
	 */
	private async overwrite(guild: Guild, role: string | Role, remove = false): Promise<number> {
		role = guild.roles.get(role as string);
		if (!role) throw new FriendlyError('the specified role is invalid!');
		let failed: number = 0;
		const channels: Collection<string, GuildChannel> = guild.channels.filter((c: GuildChannel) => c.type === 'text');
		for (const [, channel] of channels) {
			const overwrites: PermissionOverwrites = channel.permissionOverwrites.get(role.id);
			if (remove) {
				if (overwrites) await overwrites.delete().catch(() => failed++);
				continue;
			}
			if (overwrites && overwrites.deny === 2048 && overwrites.allow === 0) continue;
			await channel.overwritePermissions(role, { SEND_MESSAGES: false })
				.catch(() => failed++);
		}
		return failed;
	}
};
