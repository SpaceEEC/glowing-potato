exports.run = (bot, msg, params = []) => {
  if (!msg.channel.permissionsFor(msg.member).hasPermission('MANAGE_MESSAGES')) {
    msg.channel.sendMessage('Du darfst keine Chatnachrichten löschen, also darf ich das leider nicht für dich tun.'); // eslint-disable-line
  } else if (!msg.channel.permissionsFor(bot.user).hasPermission('MANAGE_MESSAGES')) {
    msg.channel.sendMessage('Ich darf keine Nachrichten löschen.');
  } else if (params[0] % 1 !== 0) {
    msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Fehlerhafter Parameter',
      `\`${params[0]}\` ist keine Zahl!`)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  } else {
    msg.channel.bulkDelete(parseInt(params[0]) + 1);
    msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0x00ff08)
      .addField('Erfolgreich',
      `${parseInt(params[0]) + 1} Nachrichten gelöscht!`)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      msg.author.avatarURL)
    ).then((mes) => mes.delete(5000));
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 5,
};


exports.help = {
  name: 'prune',
  description: 'Löscht die letzten [Anzahl] Nachrichten aus diesem Channel.',
  shortdescription: 'Tilgt Nachrichten',
  usage: '$conf.prefixprune [Anzahl]',
};
