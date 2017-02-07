exports.run = async (bot, msg, params = []) => {
  if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Zur Zeit wird leider nichts gespielt.')
      .then(mes => mes.delete(30000));
  } else {
    const musik = bot.internal.musik.get(msg.guild.id);
    if (msg.permlvl >= 5
      || ((!msg.conf.musicrole || (msg.conf.musicrole && msg.member.roles.has(msg.conf.musicrole)))
        && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
      if (!msg.guild.member(bot.user).voiceChannel) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
          .then((mes) => mes.delete(5000));
      } else if (msg.guild.member(bot.user).voiceChannel
        && (msg.guild.member(bot.user).voiceChannel.id
          !== msg.member.voiceChannel.id)) {
        msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
          .then((mes) => mes.delete(5000));
      } else if (params[0] % 1 === 0) {
        if (parseInt(params[0]) > 200 || parseInt(params[0]) < 0) {
          msg.channel.sendMessage('Bitte nur Zahlen von `0` bis `200` eingeben.');
        } else {
          msg.channel.send(musik.volume(Math.round(params[0] / 10) / 10));
        }
      } else {
        msg.channel.send(musik.volume('get'));
      }
    } else {
      msg.channel.send(musik.volume('get'));
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
  name: 'volume',
  shortdescription: '',
  description: 'Legt die Lautstärke fest, oder zeigt dies an. (Standardwert ist `20`)',
  usage: '$conf.prefixvolume (0-200)',
};