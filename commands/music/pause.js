exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (msg.permlvl >= 11
    || ((!msg.conf.musicgroup || (msg.conf.musicgroup && msg.member.roles.has(msg.conf.musicgroup)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.name));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!msg.guild.member(bot.user).voiceChannel) {
      msg.channel.sendMessage('Was willst du denn bitte pausieren?')
        .then((mes) => mes.delete(5000));
    } else if (!(msg.member.voiceChannel
      && msg.member.voiceChannel.id
      === msg.guild.member(bot.user).voiceChannel.id)) {
      msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten Voicechannel bist?')
        .then((mes) => mes.delete(5000));
    } else {
      msg.channel.send(musik.pauseresume(false))
        .then((mes) => mes.delete(5000));
    }
  }
});


exports.conf = {
  group: 'hidden',
  spamProtection: false,
  enabled: true,
  aliases: ['pause'],
  permLevel: 0,
};


exports.help = {
  name: 'pause',
  shortdescription: '-',
  description: 'Pausiert den aktuellen Song.',
  usage: '$conf.prefixpause',
};
