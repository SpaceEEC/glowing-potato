exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (msg.permlvl >= 11
    || ((!msg.conf.musicgroup || (msg.conf.musicgroup && msg.member.roles.has(msg.conf.musicgroup)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.name));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!msg.member.voiceChannel) {
      msg.channel.sendMessage('Du bist in keinem Voicechannel.')
        .then((mes) => mes.delete(5000));
    } else if (msg.guild.member(bot.user).voiceChannel
      && (msg.guild.member(bot.user).voiceChannel.id
        !== msg.member.voiceChannel.id)) {
      msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten Voicechannel bist?')
        .then((mes) => mes.delete(5000));
    } else if (params[0]) {
      musik.search(msg, params);
    } else {
      msg.channel.sendMessage('Sag mir doch bitte was du hören möchtest, ja?')
        .then((mes) => mes.delete(5000));
    }
  }
});


exports.conf = {
  group: 'hidden',
  spamProtection: false,
  enabled: true,
  aliases: ['search'],
  permLevel: 0,
};


exports.help = {
  name: 'search',
  shortdescription: '-',
  description: 'Ermöglicht die Suche über Youtube.',
  usage: '$conf.prefixsearch (-N) [Suche]\n'
  + 'Beispiele:\n'
  + '`$conf.prefixsearch (-3) Cash Cash` - Lässt zwischen den ersten drei Ergebnissen auswählen.\n'
  + '`$conf.prefixsearch Cash Cash` - Nimmt einfach das erste Ergebnis und fügt es hinzu.\n',
};
