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
      if (musik._music.queue.length === 0) {
        msg.channel.sendMessage('Die Queue ist leer.');
      } else if (musik._music.disp) {
        msg.channel.send(`Leere die Queue (**${musik._music.queue.length}** Songs) und beende die Wiedergabe.`)
          .then((mes) => mes.delete(5000));
        bot.info(`[${msg.guild.id}] Stopped playing through command.`);
        musik._music.queue = musik._music.queue.slice(musik._music.queue.length - 1);
        if (musik._music.disp) musik._music.disp.end('stop');
        bot.setTimeout(musik._leaveChannel.bind(musik), 2000);
      } else {
        msg.channel.sendMessage('Vor der Abschluss, der Intialisierung ist ein Stoppen leider nicht möglich.')
          .then((mes) => mes.delete(5000));
      }
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
  name: 'stop',
  shortdescription: '',
  description: 'Stopt die Wiedergabe, löscht die Queue und verlässt den Channel.',
  usage: '$conf.prefixstop\n',
};
