exports.run = async (bot, member) => {
  if (member.user.id === bot.user.id) return;
  const conf = bot.confs.get(member.guild.id);
  if (!conf.leavemsg) return;
  const response = conf.leavemsg
    .split(':user:').join(member)
    .split(':server:').join(member.guild.name); // eslint-disable-line newline-per-chained-call
  if (conf.logchannel) {
    if (!bot.channels.get(conf.logchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.logchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in logchannel(${conf.logchannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
  if (conf.anchannel) {
    if (!bot.channels.get(conf.anchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.anchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in anchannel(${conf.anchannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
};
