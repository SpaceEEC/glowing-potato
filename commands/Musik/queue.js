exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  if (!bot.internal.musik.get(msg.guild.id)) {
    msg.channel.send('Zur Zeit wird leider nichts gespielt.')
      .then(mes => mes.delete(30000));
  } else {
    const musik = bot.internal.musik.get(msg.guild.id);
    if (!musik._music.queue[0]) {
      msg.channel.send('Die Queue ist leer.').then(mes => mes.delete(30000));
    } else if (!musik._music.queue[1]) {
      bot.commands.get('np').run(bot, msg, params);
    } else {
      if (params[0] % 1 === 0) {
        params[0] = parseInt(params[0]) - 1;
        if (params[0] <= 0) params[0] = 0;
      } else {
        params[0] = 0;
      }
      const e = new bot.methods.Embed().setColor(0x0800ff).setTitle(`Songs in der Queue: ${musik._music.queue.length} | Insgesamte Länge: ${musik._formatSecs(musik._music.queue.reduce((a, b) => a + parseInt(b.info.length_seconds), 0))}`);
      if (params[0] === 0) {
        e.setThumbnail(musik._music.queue[0].info.iurl)
          .setDescription(`${musik._music.playing ? '**Spiele gerade:**' : '**Momentan pausiert:**'} `
          + `\`(${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}/${musik._formatSecs(musik._music.queue[0].info.length_seconds)})\` `
          + `Von: ${musik._music.queue[0].requester}\n`
          + `[${musik._music.queue[0].info.title}](${musik._music.queue[0].info.loaderUrl})`);
      }
      let fieldtext = '';
      const fields = [];
      for (const song in musik._music.queue) {
        if (song === '0') continue;
        let songtext = `\`${song}.\` [${musik._music.queue[song].info.title}](${musik._music.queue[song].info.loaderUrl}) Länge: ${musik._formatSecs(musik._music.queue[song].info.length_seconds)} | Von: ${musik._music.queue[song].requester}\n`;
        if ((songtext.length + fieldtext.length) > 1024) {
          fields.push(fieldtext);
          fieldtext = songtext;
        } else {
          fieldtext += songtext;
        }
      }
      if (fieldtext.length > 0) fields.push(fieldtext);
      if (!fields[params[0]]) params[0] = fields.length - 1;
      e.addField(params[0] === 0 ? 'Warteschlange:' : 'Weitere Einträge', fields[params[0]]);
      e.setFooter(`Seite ${params[0] + 1} von ${fields.length}`);
      msg.channel.sendEmbed(e).then((mes) => mes.delete(30000));
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
  name: 'queue',
  shortdescription: '',
  description: 'Zeigt die aktuelle Warteschlange an. (Optional kann eine bestimmte Seite angegeben werden.)',
  usage: '$conf.prefixqueue (Seite)',
};
