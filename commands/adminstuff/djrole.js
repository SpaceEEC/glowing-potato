const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = class ConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'djrole',
      aliases: ['dj', 'mrole', 'musicrole', 'djroles', 'mroles', 'musicroles'],
      group: 'adminstuff',
      memberName: 'djrole',
      description: 'Adds or removes a DjRole.',
      details: stripIndents`To add or remove a role, simply specify it, either with a mention, name or ID.
      If no role is present, @\u200beveryone is allowed to use music commands.
      To show all set up roles, simply omit the role parameter.`,
      examples: [
        '`djrole @DJ` Adds or removes the role `@DJ` to the dj roles.',
        '`djrole` Displays all dj roles.'
      ],
      guildOnly: true,
      args: [
        {
          key: 'role',
          prompt: 'which role do you like to add or remove?\n',
          type: 'role',
          default: 'show'
        }
      ]
    });
  }

  hasPermission(msg) {
    const adminRoles = msg.guild.settings.get('adminRoles', []);
    return msg.member.roles.some(r => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    const roles = msg.guild.settings.get('djRoles', []).filter(r => msg.guild.roles.has(r));

    if (args.role === 'show') {
      msg.say(`DjRoles:
      ${roles.length ? roles.map(r => `\`@${msg.guild.roles.get(r).name}\``).join(', ') : '@\u200beveryone'}`);
      return;
    }

    if (roles.includes(args.role.id)) {
      roles.splice(roles.indexOf(args.role.id), 1);
    } else {
      args.added = true;
      roles.push(args.role.id);
    }

    msg.guild.settings.set('djRoles', roles);

    msg.embed(new Embed().setColor(args.added ? 0x32CD32 : 0xFF0000)
      .setDescription(`${args.role} ${args.added ? `has been added to` : 'has been removed from'} the djRoles!`));
  }
};
