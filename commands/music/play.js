exports.run = async (bot, msg, params = []) => {
  if (msg.permlvl >= 5
    || ((!msg.conf.musicrole || (msg.conf.musicrole && msg.member.roles.has(msg.conf.musicrole)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.id));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!params[0]) {
      msg.channel.sendMessage('Bitte gib mir einen Youtubelink oder ID mit, andernfalls kann ich leider nichts spielen.')
        .then((mes) => mes.delete(5000));
    } else if (!msg.member.voiceChannel) {
      msg.channel.sendMessage('Ich kann dich in keinem Voicechannel finden, bist du sicher, dass du dich gerade in einem Voice Channel in dieser Gilde befindest?')
        .then((mes) => mes.delete(5000));
    } else if (msg.guild.member(bot.user).voiceChannel
      && (msg.guild.member(bot.user).voiceChannel.id
        !== msg.member.voiceChannel.id)) {
      msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
        .then((mes) => mes.delete(5000));
    } else if (params[0].includes('watch?v=') || params[0].length === 11) {
      musik.add(msg, params[0]);
    } else if (params[0].includes('playlist?list=')) {
      musik.bulkadd(msg, params[0].split('playlist?list=')[1], params[1]);
    } else if (params[0].length > 11) {
      musik.bulkadd(msg, params[0], params[1]);
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
  name: 'play',
  shortdescription: '',
  description: 'Spielt Songs.\nDer Befehl Akzeptiert Videos und Playlists als Youtube IDs und Links.',
  usage: '$conf.prefixplay [ID/Url]',
};
