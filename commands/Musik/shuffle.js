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
      if (musik._music.queue.length < 3) {
        msg.channel.sendMessage('Es lohnt sich nicht so wenig Lieder zu mischen.');
      }
      const array = musik._music.queue.slice(1);
      let currentIndex = array.length;
      let temporaryValue;
      let randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      array.splice(0, 0, musik._music.queue[0]);
      musik._music.queue = array;
      msg.channel.send('Die Warteschlange wurde gemischt.')
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
  name: 'shuffle',
  shortdescription: '',
  description: 'Mischt die Warteschlange einmal kräftig durch.',
  usage: '$conf.prefixshuffle\n',
};
