import { stripIndents } from 'common-tags';
import { Message, RichEmbed, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class DJRoleCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['dj', 'mrole', 'musicrole', 'djroles', 'mroles', 'musicroles'],
			args: [
				{
					default: 'show',
					key: 'role',
					prompt: 'which role do you like to add or remove?\n',
					type: 'role',
				},
			],
			description: 'DJ roles configuration.',
			details: stripIndents`
				To add or remove a role, simply specify it, either with a mention, name or ID.
				If no role is present, @\u200beveryone is allowed to use music commands.
				To show all set up roles, simply omit the role parameter.`,
			examples: [
				'`djrole @DJ` Adds or removes the role `@DJ` to the dj roles.',
				'`djrole` Displays all dj roles.',
			],
			group: 'administration',
			guildOnly: true,
			memberName: 'djrole',
			name: 'djrole',

		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { role: Role | string, added: boolean }): Promise<Message | Message[]> {
		const roles: string[] = this.client.provider
			.get(msg.guild.id, 'djRoles', [])
			.filter((r: string) => msg.guild.roles.has(r));

		if (!(args.role instanceof Role)) {
			return msg.say(`Dj roles: ${roles.length
				? roles.map((r: string) => `\`@${msg.guild.roles.get(r).name}\``).join(', ')
				: '@\u200beveryone'}`,
			);
		}

		if (roles.includes(args.role.id)) {
			roles.splice(roles.indexOf(args.role.id), 1);
		} else {
			args.added = true;
			roles.push(args.role.id);
		}

		this.client.provider.set(msg.guild.id, 'djRoles', roles);

		return msg.embed(new RichEmbed().setColor(args.added ? 0x32CD32 : 0xFF0000)
			.setDescription(`\`@${args.role.name}\` ${args.added
				? `has been added to`
				: 'has been removed from'} the djRoles!`,
			),
		);
	}
}
