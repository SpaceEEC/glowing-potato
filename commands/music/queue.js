exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Es läuft gerade nichts.')
      .then(mes => mes.delete(30000));
  } else {
    const musik = bot.internal.musik.get(msg.guild.id);
    msg.channel.send(musik.queue())
      .then((mes) => mes.delete(30000));
  }
});


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'queue',
  shortdescription: '',
  description: 'Zeigt die aktuelle Warteschlange an.',
  usage: '$conf.prefixqueue',
};
