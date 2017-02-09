exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (!msg.guild.member(bot.user).voiceChannel || !bot.internal.music.channel(bot, msg, true)) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts, füge doch einfach etwas hinzu!')
          .then((mes) => mes.delete(5000));
      } else {
        msg.channel.send(musik.summon(msg))
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
  name: 'summon',
  shortdescription: '',
  description: 'Lässt den Bot in den aktuallen Channel wechseln.',
  usage: '$conf.prefixsummon',
};
