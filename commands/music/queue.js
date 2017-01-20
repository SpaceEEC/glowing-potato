exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!bot.internal.musik.get(msg.guild.id)) {
    bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg.guild.name));
  }
  const musik = bot.internal.musik.get(msg.guild.id);
  msg.channel.send(musik.queue())
    .then((mes) => mes.delete(30000));
});


exports.conf = {
  group: 'hidden',
  spamProtection: false,
  enabled: true,
  aliases: ['queue'],
  permLevel: 0,
};


exports.help = {
  name: 'queue',
  shortdescription: '-',
  description: 'Zeigt die aktuelle Warteschlange an.',
  usage: '$conf.prefixqueue',
};
