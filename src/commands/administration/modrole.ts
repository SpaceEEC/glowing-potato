import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class ModRoleCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['mod', 'mods', 'modroles'],
			args: [
				{
					default: 'show',
					key: 'role',
					prompt: 'which role do you like to use?\n',
					type: 'role',
				},
			],
			description: 'Mod roles configuration.',
			details: stripIndents`
				Adds or removes a mod role in this guild.
				To remove or add a role simply \`@Mention\` it or provide the name or ID.
				To show all roles in that categorie, omit the parameter.`,
			examples: [
				'`modrole @Mods` Adds or removes the role `@Mods` to the mod role of the bot.',
				'Emitting a role displays all mod roles.',
			],
			group: 'administration',
			guildOnly: true,
			memberName: 'modrole',
			name: 'modrole',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { role: Role | string, added: boolean }): Promise<Message | Message[]> {
		const roles: string[] = this.client.provider
			.get(msg.guild.id, 'modRoles', [])
			.filter((r: string) => msg.guild.roles.has(r));

		if (!(args.role instanceof Role)) {
			return msg.say(`Mod roles: ${roles.length
				? roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ')
				: 'No role(s) set up.'}`);
		}

		if (roles.includes(args.role.id)) {
			roles.splice(roles.indexOf(args.role.id), 1);
		} else {
			args.added = true;
			roles.push(args.role.id);
		}

		this.client.provider.set(msg.guild.id, 'modRoles', roles);

		return msg.say(`\`@${args.role.name}\` ${args.added
			? `is now one of the`
			: 'has been removed from the'
			} mod roles!`,
		);
	}
}
