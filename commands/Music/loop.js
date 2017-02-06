exports.run = async (bot, msg, params = []) => {
  if (msg.permlvl >= 5
    || ((!msg.conf.musicrole || (msg.conf.musicrole && msg.member.roles.has(msg.conf.musicrole)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (!msg.guild.member(bot.user).voiceChannel) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
          .then((mes) => mes.delete(5000));
      } else if (msg.guild.member(bot.user).voiceChannel
        && (msg.guild.member(bot.user).voiceChannel.id
          !== msg.member.voiceChannel.id)) {
        msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
          .then((mes) => mes.delete(5000));
      } else if (!params[0]) {
        msg.channel.send(musik.loop())
          .then((mes) => mes.delete(5000));
      } else if (['an', 'true', 'y', 'on'].includes(params[0].toLowerCase())) {
        msg.channel.send(musik.loop(true))
          .then((mes) => mes.delete(5000));
      } else if (['aus', 'false', 'n', 'off'].includes(params[0].toLowerCase())) {
        msg.channel.send(musik.loop(false))
          .then((mes) => mes.delete(5000));
      } else {
        msg.channel.send(musik.loop())
          .then((mes) => mes.delete(5000));
      }
    }
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'loop',
  shortdescription: '',
  description: 'Aktiviert/Deaktiviert das Wiederholen, des letzten Songs in der Wiedergabeliste.',
  usage: '$conf.prefixloop (an/aus)',
};

