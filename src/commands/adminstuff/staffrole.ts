import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class ConfigCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'staffrole',
			group: 'adminstuff',
			memberName: 'staffrole',
			description: 'Adds or removes a staffrole (Admin or Mod) in this guild.',
			details: stripIndents`Provide as type either \`admin\` or \`mod\`.
      To remove or add a role simply \`@Mention\` it or provide the name or ID.
      To show all roles in that categorie, omit the parameter.`,
			examples: [
				'`staffrole admin @Admins` Adds or removes the role `@Admins` to the admin roles of the bot.',
				'`staffrole admin` Displays all admin roles.',
				'For mod roles just replace admin with mod',
			],
			guildOnly: true,
			args: [
				{
					key: 'type',
					label: 'mod or admin',
					prompt: 'do you wish to mody the admin or mod roles?\n',
					validate: (value: string) => ['mod', 'mods', 'modrole', 'modroles', 'admin', 'admins', 'adminrole', 'adminroles'].includes(value.toLowerCase()),
					parse: (value: string) => {
						if (['mod', 'mods', 'modrole', 'modroles'].includes(value.toLowerCase())) return 'modRoles';
						else return 'adminRoles';
					}
				},
				{
					key: 'role',
					prompt: 'which role do you like to use?\n',
					type: 'role',
					default: 'show',
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { type: string, role: Role | string, added: boolean }): Promise<Message | Message[]> {
		const roles: string[] = this.client.provider.get(msg.guild.id, args.type, []).filter((r: string) => msg.guild.roles.has(r));

		if (args.role === 'show') {
			msg.say(`${args.type}: ${roles.length ? roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ') : '@\u200beveryone'}`);
			return;
		}

		if (roles.includes((args.role as Role).id)) {
			roles.splice(roles.indexOf((args.role as Role).id), 1);
		} else {
			args.added = true;
			roles.push((args.role as Role).id);
		}

		this.client.provider.set(msg.guild.id, args.type, roles);

		msg.say(`\`@${(args.role as Role).name}\` ${args.added ? `is now one of the` : 'has been removed from the'} ${args.type}!`);
	}
};
