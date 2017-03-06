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
      details: stripIndents`There is either vlogChannel, anChannel or logChannel as the type, use the aliases to set these.
      To remove a channel, specify just specify that channel.`,
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
    args.cmd = getUsedAlias(msg);

    const config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;

    if (args.message === 'show' || args.channel === 'show') {
      msg.say(config[args.type] ? config[args.type] : `No ${args.type} set.`);
      return;
    }

    config[args.type] = args.channel === config[args.type] ? null : args.channel.id;

    await GuildConfig.update(config, { where: { guildID } });

    msg.say(`The ${args.type} is now ${args.channel || 'disabled'}!`);
  }


};
