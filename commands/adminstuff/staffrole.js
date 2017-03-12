const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class ConfigCommand extends Command {
	constructor(client) {
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
					validate: async (value) => {
						return ['mod', 'mods', 'modrole', 'modroles', 'admin', 'admins', 'adminrole', 'adminroles'].includes(value.toLowerCase());
					},
					parse: (value) => {
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

	hasPermission(msg) {
		const adminRoles = msg.guild.settings.get('adminRoles', []);
		return msg.member.roles.some(r => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const roles = msg.guild.settings.get(args.type, []).filter(r => msg.guild.roles.has(r));

		if (args.role === 'show') {
			msg.say(`${args.type}: ${roles.length ? roles.map(r => `\`@${msg.guild.roles.get(r).name}\``).join(', ') : '@\u200beveryone'}`);
			return;
		}

		if (roles.includes(args.role.id)) {
			roles.splice(roles.indexOf(args.role.id), 1);
		} else {
			args.added = true;
			roles.push(args.role.id);
		}

		msg.guild.settings.set(args.type, roles);

		msg.say(`\`@${args.role.name}\` ${args.added ? `is now one of the` : 'has been removed from the'} ${args.type}!`);
	}
};
