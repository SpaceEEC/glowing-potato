exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!msg.member.hasPermission('MANAGE_MESSAGES')) {
    return msg.channel.sendMessage('Du darfst keine Chatnachrichten löschen, also darf ich das leider nicht für dich tun.'); // eslint-disable-line
  }
  if (!msg.guild.member(bot.user).hasPermission('MANAGE_MESSAGES')) {
    return msg.channel.sendMessage('Ich darf keine Nachrichten löschen.');
  }
  if (params[0] % 1 !== 0) {
    return msg.channel.sendEmbed(new bot.methods.Embed()
    .setColor(0xff0000)
    .addField('Fehlerhafter Parameter',
      `\`${params[0]}\` ist keine Zahl!`)
    .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  }
  msg.channel.bulkDelete(parseInt(params[0]) + 1);
  return msg.channel.sendEmbed(new bot.methods.Embed()
  .setColor(0x00ff08)
  .addField('Erfolgreich',
    `${parseInt(params[0]) + 1} Nachrichten gelöscht!`)
  .setFooter(`${msg.author.username}: ${msg.content}`,
    msg.author.avatarURL)
  ).then((mes) => mes.delete(5000));
});


exports.conf = {
  group: 'Modstuff',
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 5,
};
exports.help = {
  name: 'prune',
  description: 'Löscht die letzten [Anzahl] Nachrichten aus diesem Channel.',
  shortdescription: 'Nachrichten löschen',
  usage: '$conf.prefixprune [Anzahl]',
};
