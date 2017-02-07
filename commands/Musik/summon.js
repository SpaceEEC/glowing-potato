exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (msg.permlvl >= 5
    || ((!msg.conf.musicrole || (msg.conf.musicrole && msg.member.roles.has(msg.conf.musicrole)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (!msg.guild.member(bot.user).voiceChannel) {
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