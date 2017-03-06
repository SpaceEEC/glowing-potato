const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');

module.exports = class ConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'musicchannel',
      aliases: ['djchannel', 'djchannels', 'mchannel', 'mchannels', 'musicchannels'],
      group: 'adminstuff',
      memberName: 'musicchannel',
      description: 'Adds or removes a musicchannel (music commands are only allowed in those) for this guild.\nIf no channel is present the commands are allowed anywhere.',
      guildOnly: true,
      args: [
        {
          key: 'channel',
          prompt: 'which channel do you like to add or remove?\n',
          type: 'channel',
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
    const channels = msg.guild.settings.get('djChannel', []);

    if (args.channel === 'show') {
      msg.embed(new Embed().setColor(0xFFFF00)
        .setDescription(channels.length ? channels.map(r => `<#${r}>`).join(', ') : 'No channel set, so everywhere.'));
      return;
    }

    if (channels.includes(args.channel.id)) {
      channels.splice(channels.indexOf(args.channel.id), 1);
    } else {
      args.added = true;
      channels.push(args.channel.id);
    }

    msg.guild.settings.set('djChannel', channels);

    msg.embed(new Embed().setColor(args.added ? 0x32CD32 : 0xFF0000)
      .setDescription(`${args.channel} ${args.added ? `has been added to` : 'has been removed from'} the music channels!`));
  }
};
