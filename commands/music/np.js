exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Es läuft gerade nichts.')
      .then(mes => mes.delete(30000));
  } else {
    const musik = bot.internal.musik.get(msg.guild.id);
    msg.channel.send(musik.np())
      .then(mes => mes.delete(30000));
  }
});


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'np',
  shortdescription: '',
  description: 'Zeigt den aktuell gespielten Song an.',
  usage: '$conf.prefixnp',
};
