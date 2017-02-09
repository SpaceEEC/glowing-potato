exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Zur Zeit wird leider nichts gespielt.')
      .then(mes => mes.delete(30000));
  } else {
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!musik._music.queue[0]) {
      msg.channel.send('Die Queue ist leer.').then(mes => mes.delete(30000));
    } else {
      msg.channel.sendEmbed(new bot.methods.Embed().setColor(0x0800ff).setThumbnail(musik._music.queue[0].info.iurl)
        .setTitle(musik._music.playing ? '**Wird gerade gespielt:**' : '**Momentan pausiert:**')
        .setDescription(`[${musik._music.queue[0].info.title}](${musik._music.queue[0].info.loaderUrl})\n`
        + `Hinzugefügt von: ${musik._music.queue[0].requester}\n`
        + `Stand: \`(${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}/${musik._formatSecs(musik._music.queue[0].info.length_seconds)})\`\n`))
        .then(mes => mes.delete(30000));
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
  name: 'np',
  shortdescription: '',
  description: 'Zeigt den aktuell gespielten Song an.',
  usage: '$conf.prefixnp',
};
