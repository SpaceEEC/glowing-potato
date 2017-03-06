const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');

module.exports = class ConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'staffrole',
      group: 'adminstuff',
      memberName: 'staffrole',
      description: 'Adds or removes a staffrole (Admin or Mod) in this guild.',
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
      msg.embed(new Embed().setColor(0xFFFF00)
        .setDescription(roles.length ? roles.map(r => `<@&${r}>`).join(', ') : `No ${args.type} set.`));
      return;
    }

    if (roles.includes(args.role.id)) {
      roles.splice(roles.indexOf(args.role.id), 1);
    } else {
      args.added = true;
      roles.push(args.role.id);
    }

    msg.guild.settings.set(args.type, roles);

    msg.embed(new Embed().setColor(args.added ? 0x32CD32 : 0xFF0000)
      .setDescription(`The ${args.role} ${args.added ? `is now one of the` : 'has been removed from the'} ${args.type}!`));
  }
};
