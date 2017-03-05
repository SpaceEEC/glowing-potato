const { Command } = require('discord.js-commando');
const { join } = require('path');
const GuildConfig = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'GuildConfig'));
const { stripIndents } = require('common-tags');

module.exports = class LogchannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'logchannel',
      aliases: ['log', 'logs'],
      group: 'adminstuff',
      memberName: 'logchannel',
      description: 'Enables or disables logging of different types for this guild.',
      details: 'There is either vlogChannel, anChannel or logChannel as the type.',
      guildOnly: true,
      args: [
        {
          key: 'type',
          prompt: 'which type of logs do you wish to enable or disable?\n',
          validate: async (value) => {
            if (['vlogchannel', 'logchannel', 'anchannel'].includes(value.toLowerCase())) return true;
            return 'Pick one of either vlogChannel, anChannel or logChannel.';
          },
          parse: (value) => {
            if (value.toLowerCase() === 'vlogchannel') return 'vlogChannel';
            if (value.toLowerCase() === 'logchannel') return 'logChannel';
            if (value.toLowerCase() === 'anchannel') return 'anChannel';
            throw new Error('Unknown value');
          }
        },
        {
          key: 'channel',
          prompt: 'to which channel shall the messages be send?\n',
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
    const config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;

    if (args.message === 'show') {
      msg.say(stripIndents`${args.type}
      ${config[args.type] ? config[args.type] : 'No channel set.'}`);
      return;
    }

    config[args.type] = args.channel === '' ? null : args.channel.id;

    await GuildConfig.update(config, { where: { guildID } });

    msg.say(`The ${args.type} is now ${args.channel || 'disabled'}!`);
  }


};
