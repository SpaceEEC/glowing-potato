exports.run = async (bot, msg, params = []) => {
  if (msg.permlvl >= 5
    || ((!msg.conf.musicrole || (msg.conf.musicrole && msg.member.roles.has(msg.conf.musicrole)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.id));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!msg.member.voiceChannel) {
      msg.channel.sendMessage('Ich kann dich in keinem Voicechannel finden, bist du sicher, dass gerade dich in einem in dieser Gilde befindest?')
        .then((mes) => mes.delete(5000));
    } else if (msg.guild.member(bot.user).voiceChannel
      && (msg.guild.member(bot.user).voiceChannel.id
        !== msg.member.voiceChannel.id)) {
      msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
        .then((mes) => mes.delete(5000));
    } else if (params[0]) {
      musik.search(msg, params);
    } else {
      msg.channel.sendMessage('Ich könnte eine Suche gebrauchen. Ein einziges Wort würde reichen!')
        .then((mes) => mes.delete(5000));
    }
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['serach'],
  permLevel: 0,
};


exports.help = {
  name: 'search',
  shortdescription: '',
  description: 'Ermöglicht die Suche über Youtube.',
  usage: '$conf.prefixsearch (-N) [Suche]\n'
  + 'Beispiele:\n'
  + '`$conf.prefixsearch (-3) Cash Cash` - Lässt zwischen den ersten drei Ergebnissen auswählen.\n'
  + '`$conf.prefixsearch Cash Cash` - Nimmt einfach das erste Ergebnis und fügt es hinzu.\n',
};
