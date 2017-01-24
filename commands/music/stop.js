exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (msg.permlvl >= 11
    || ((!msg.conf.musicgroup || (msg.conf.musicgroup && msg.member.roles.has(msg.conf.musicgroup)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.name));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!msg.guild.member(bot.user).voiceChannel) {
      msg.channel.sendMessage('Was willst du denn bitte stoppen?')
        .then((mes) => mes.delete(5000));
    } else if (msg.guild.member(bot.user).voiceChannel
      && (msg.guild.member(bot.user).voiceChannel.id
        !== msg.member.voiceChannel.id)) {
      msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten Voicechannel bist?')
        .then((mes) => mes.delete(5000));
    } else {
      msg.channel.send(musik.stop())
        .then((mes) => mes.delete(5000));
    }
  }
});


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
