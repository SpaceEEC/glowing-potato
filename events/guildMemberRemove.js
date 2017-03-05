const { join } = require('path');
const GuildConfig = require(join(__dirname, '..', 'dataProviders', 'models', 'GuildConfig'));
const { getValue } = require(join(__dirname, '..', 'util', 'util'));
const moment = require('moment');
moment.locale('de');

exports.run = async (client, member) => {
  if (member.user.id === client.user.id) return;

  const conf = await getValue(GuildConfig, { where: { guildID: member.guild.id } });

  if (!conf || (conf && !conf.leaveMessage)) return;

  const response = conf.leaveMessage
    .split(':member:').join(`\`@${member.user.username}#${member.user.discriminator}\``)
    .split(':server:').join(member.guild.name); // eslint-disable-line newline-per-chained-call
  const botMember = await member.guild.fetchMember(client.user);

  if (conf.logChannel) {
    if (!client.channels.has(conf.logChannel)) {
      conf.logChannel = null;
      return GuildConfig.update(conf, { where: { guildID: member.guild.id } }); // eslint-disable-line consistent-return
    }
    if (!client.channels.get(conf.logChannel)
      .permissionsFor(botMember)
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.logChannel).sendMessage(response).catch(e => {
      client.emit('error', `Error while writing in the logChannel (${conf.logChannel}) of (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }

  if (conf.anChannel) {
    if (!client.channels.has(conf.anChannel)) {
      conf.anChannel = null;
      return GuildConfig.update(conf, { where: { guildID: member.guild.id } }); // eslint-disable-line consistent-return
    }
    if (!client.channels.get(conf.anChannel)
      .permissionsFor(botMember)
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.anChannel).sendMessage(response).catch(e => {
      client.emit('error', `Error while writing in the anChannel (${conf.anChannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
};
