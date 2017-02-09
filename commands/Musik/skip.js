exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else if (!msg.guild.member(bot.user).voiceChannel) {
      msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
        .then((mes) => mes.delete(5000));
    } else if (!bot.internal.music.channel(bot, msg)) {
      msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
        .then((mes) => mes.delete(5000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (musik._music.queue.length === 0 || !musik._music.disp) {
        msg.channel.sendMessage('Die Queue ist leer, da gibt es nichts zu skippen.');
      }
      const response = `-- **${musik._music.queue[0].info.title}**`;
      bot.info(`[${msg.guild.id}] Song skipped.`);
      musik._music.disp.end('skip');
      msg.channel.sendMessage(response)
        .then((mes) => mes.delete(30000));
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
  name: 'skip',
  shortdescription: '',
  description: 'Skippt den aktuellen Song.',
  usage: '$conf.prefixskip\n',
};
