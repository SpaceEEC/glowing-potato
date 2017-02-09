exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (!msg.guild.member(bot.user).voiceChannel) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
          .then((mes) => mes.delete(5000));
      } else if (!bot.internal.music.channel(bot, msg)) {

        msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
          .then((mes) => mes.delete(5000));
      } else {
        msg.channel.send(musik.stop())
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
  name: 'stop',
  shortdescription: '',
  description: 'Stopt die Wiedergabe, löscht die Queue und verlässt den Channel.',
  usage: '$conf.prefixstop\n',
};
