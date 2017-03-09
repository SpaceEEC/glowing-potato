const { Command } = require('discord.js-commando');
const { join } = require('path');
const GuildConfig = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'GuildConfig'));
const { getUsedAlias } = require(join(__dirname, '..', '..', 'util', 'util'));
const { stripIndents } = require('common-tags');

module.exports = class LogchannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'logchannel',
      aliases: ['vlogchannel', 'anchannel'],
      group: 'adminstuff',
      memberName: 'logchannel',
      description: 'Enables or disables logging of different types for this guild.',
      details: stripIndents`There is either vlogchannel, anchannel or logchannel as the type, use the aliases to set these.
      To remove a channel, specify just specify that channel.
      Mention the same channel again to remove it.
      Omit the channel parameter to show the current channel.`,
      examples: [
        '`vlogchannel #logs`',
        '`anchannel #logs`',
        '`logchannel #logs`',
      ],
      guildOnly: true,
      args: [
        {
          key: 'channel',
          prompt: 'wich channel do you like to set up or remove?\n',
          type: 'channel',
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
    const { id: guildID } = msg.guild;
    args.cmd = getUsedAlias(msg, { vlogchannel: 'vlogChannel', anchannel: 'anChannel', logchannel: 'logChannel' });

    const config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;

    if (args.message === 'show' || args.channel === 'show') {
      msg.say(config[args.cmd] ? config[args.cmd] : `No ${args.cmd} set.`);
      return;
    }

    config[args.cmd] = args.channel === config[args.cmd] ? null : args.channel.id;

    await GuildConfig.update(config, { where: { guildID } });

    msg.say(`The ${args.cmd} is now ${args.channel || 'disabled'}!`);
  }


};
