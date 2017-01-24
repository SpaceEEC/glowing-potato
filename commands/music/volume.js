exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!bot.internal.musik.get(msg.guild.id)) {
    bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.name));
  }
  const musik = bot.internal.musik.get(msg.guild.id);
  if (!msg.guild.member(bot.user).voiceChannel) {
    msg.channel.sendMessage('Sehe ich so aus, als würde ich gerade etwas spielen?')
      .then((mes) => mes.delete(5000));
  } else if (!(msg.guild.member(bot.user).voiceChannel
    && msg.guild.member(bot.user).voiceChannel.members.has(msg.author.id))) {
    msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten Voicechannel bist?')
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
});


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
