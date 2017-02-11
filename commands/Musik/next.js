exports.run = async (bot, msg, params = []) => {
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else if (!msg.guild.member(bot.user).voiceChannel) {
      msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
        .then((mes) => mes.delete(5000));
    } else if (!bot.internal.music.channel(bot, msg) || !params[0] || isNaN(params[0])) {
      msg.channel.send(bot.commands.get('np').run(bot, msg, []))
        .then((mes) => mes.delete(5000));
    } else {
      const musik = bot.internal.musik.get(msg.guild.id);
      if (!musik._music.queue[parseInt(params[0])] || parseInt(params[0] < 1)) {
        msg.channel.send('Diese Position ist ungültig.')
          .then((mes) => mes.delete(5000));
      } else {
        musik._music.queue.splice(1, 0, musik._music.queue.splice(parseInt(params[0]), 1)[0]);
        msg.channel.send(bot.commands.get('np').run(bot, msg, ['1']));
      }
    }
  } else if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Zur Zeit wird leider nichts gespielt.')
      .then(mes => mes.delete(30000));
  } else {
    msg.channel.send(bot.commands.get('np').run(bot, msg, params));
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['drag'],
  permLevel: 0,
};


exports.help = {
  name: 'next',
  shortdescription: '',
  description: 'Pausiert den aktuellen Song.',
  usage: '$conf.prefixpause',
};
