const { Command } = require('discord.js-commando');
const { join } = require('path');
const GuildConfig = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'GuildConfig'));
const { getUsedAlias } = require(join(__dirname, '..', '..', 'util', 'util'));
const { stripIndents } = require('common-tags');

module.exports = class LogchannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'joinmessage',
      aliases: ['joinmsg', 'leavemessage', 'leavemsg'],
      group: 'adminstuff',
      memberName: 'joinmessage',
      description: 'Sets or removes the join or leave message for this guild.\nTo set or remove the leave message use the alias.',
      examples: [
        stripIndents`\`joinmessage Welcome to :server:, :member:!\`
        Will look like:
        Welcome to Discordinios, \`@space#0302\`!\n\u200b`,
        stripIndents`\`joinmessage remove\`
        Will disable that message.\n\u200b`,
        'Same usage for `leavemessage`.'],
      guildOnly: true,
      args: [
        {
          key: 'message',
          prompt: stripIndents`what shall that message be?
          Respond with \`remove\` to disable that message.\n`,
          type: 'string',
          max: 1800,
          default: 'show',
        },
      ]
    });
  }

  hasPermission(msg) {
    const adminRoles = msg.guild.settings.get('adminRoles', []);
    return msg.member.roles.some(r => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    const { id: guildID } = msg.guild;
    args.cmd = getUsedAlias(msg, { joinmessage: 'joinMessage', joinmsg: 'joinMessage', leavemessage: 'leaveMessage', leavemsg: 'leaveMessage' });

    const config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;

    if (args.message === 'show') {
      msg.say(config[args.cmd] ? config[args.cmd] : 'No message set.');
      return;
    }

    config[args.cmd] = args.message === 'remove' ? null : args.message;

    await GuildConfig.update(config, { where: { guildID } });

    msg.say(stripIndents`The ${args.cmd} is now ${`\`${config[args.cmd] ? args.message : 'disabled'}\``}!
    ${config.anChannel || config.logChannel ? '' : 'Info: No channel to announce or log set up!'}`);
  }


};
