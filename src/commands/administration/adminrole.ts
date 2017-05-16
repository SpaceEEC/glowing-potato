import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class AdminRoleCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			name: 'adminrole',
			aliases: ['admin', 'admins', 'adminroles'],
			group: 'administration',
			memberName: 'adminrole',
			description: 'Admin roles configuration.',
			details: stripIndents`
				Adds or removes a admin role in this guild.
				To remove or add a role simply \`@Mention\` it or provide the name or ID.
      			To show all roles in that categorie, omit the parameter.`,
			examples: [
				'`adminrole @Admins` Adds or removes the role `@Admins` to the admin roles of the bot.',
				'`adminrole` Displays all admin roles.'
			],
			guildOnly: true,
			args: [
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

	public async run(msg: CommandMessage, args: { role: Role | string, added: boolean }): Promise<Message | Message[]> {
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).filter((r: string) => msg.guild.roles.has(r));

		if (!(args.role instanceof Role)) {
			return msg.say(`Admin roles: ${roles.length ? roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ') : 'No role set up.'}`);
		}

		if (roles.includes(args.role.id)) {
			roles.splice(roles.indexOf(args.role.id), 1);
		} else {
			args.added = true;
			roles.push(args.role.id);
		}

		this.client.provider.set(msg.guild.id, 'adminRoles', roles);

		return msg.say(`\`@${args.role.name}\` ${args.added ? `is now one of` : 'has been removed from'} the admin roles!`);
	}
}
