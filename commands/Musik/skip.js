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
        msg.channel.sendMessage('Die Queue ist leer, da gibt es nichts zu skippen.\nOder die Intialisierungsphase ist noch nicht vollendet, dies dauert einen kleinen moment.');
      } else {
        msg.channel.sendEmbed(new bot.methods.Embed().setColor(0xff0000).setThumbnail(musik._music.queue[0].info.iurl)
          .setAuthor(`${msg.member.displayName} hat geskippt:`, msg.author.displayAvatarURL)
          .setDescription(`[${musik._music.queue[0].info.title}](${musik._music.queue[0].info.loaderUrl})\n`
          + `Hinzugefügt von: ${musik._music.queue[0].requester}\n`
          + `Stand: \`(${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}/${musik._formatSecs(musik._music.queue[0].info.length_seconds)})\`\n`))
          .then(mes => mes.delete(30000));
        bot.info(`[${msg.guild.id}] Song skipped.`);
        musik._music.disp.end('skip');
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
  name: 'skip',
  shortdescription: '',
  description: 'Skippt den aktuellen Song.',
  usage: '$conf.prefixskip\n',
};
