exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else if (!msg.guild.member(bot.user).voiceChannel) {
      msg.channel.sendMessage('Zur Zeit spiele ich leider nichts, füge doch einfach etwas hinzu!')
        .then((mes) => mes.delete(5000));
    } else if (bot.internal.music.channel(bot, msg, true)) {
      const musik = bot.internal.musik.get(msg.guild.id);
      musik._music.con = await msg.member.voiceChannel.join();
      musik._vChannel = msg.member.voiceChannel;
      msg.channel.sendMessage('Deinem Channel erfolgreich beigetreten.')
        .then((mes) => mes.delete(5000));
    } else {
      msg.channel.sendMessage('Du bist nicht in einem Channel, dem ich beitreten und sprechen darf.')
        .then((mes) => mes.delete(5000));
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
  description: 'Lässt den Bot in den aktuallen Channel wechseln.\nFunktioniert nur, falls der Bot bereits spielt.',
  usage: '$conf.prefixsummon',
};
