const request = require('superagent');


exports.run = async (bot, msg, params = []) => { // eslint-disable-line
  if (!params[0]) {
    const mes = await msg.channel.sendEmbed({
      title: 'Was soll ich Nachschlagen?',
      description: 'Bedenke, dass du mit `-Nummer` (Nummer mit einer Zahl ersetzen)'
      + '\nweitere Definitionen nachschlagen kannst.',
      fields: [
        {
          name: `\u200b`,
          value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
        }],
      color: msg.member.highestRole.color,
    });
    try {
      const collected = msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
        if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] });
      const input = collected.first().content;
      mes.delete();
      let parems = collected.first().content.split(' ');
      if (input === 'cancel') {
        collected.first().delete();
        msg.delete();
      } else if (parems[0].match(/^-\d+$/g)) {
        query(bot, msg, params.slice(1), params[0].replace('-', ''));
      } else {
        query(bot, msg, parems, 1);
      }
    } catch (err) {
      if (err.size) {
        msg.delete();
        mes.delete();
      } else {
        bot.err(err.stack ? err.stack : err);
      }
    }
  } else if (params[0].match(/^-\d+$/g)) {
    query(bot, msg, params.slice(1), params[0].replace('-', ''));
  } else {
    query(bot, msg, params, 1);
  }
};


async function query(bot, msg, params, definition) {
  const res = await request.get(`http://api.urbandictionary.com/v0/define?term=${params.join(' ')}`)
    .send(null)
    .set('Content-Type', 'application/json');
  definition = parseInt(definition) - 1;
  if (res.body.list.length === 0) {
    return msg.channel.sendEmbed(
      new bot.methods.Embed()
        .setColor(0x1d2439)
        .setAuthor('Urbandictionary',
        'http://www.urbandictionary.com/favicon.ico',
        'http://www.urbandictionary.com/')
        .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
        .addField('Keine Ergebnisse', 'Vielleicht einen Tippfehler gemacht?')
        .addField('Suche:', `[Link](http://www.urbandictionary.com/define.php?term=${params.join('+')})`)
        .setFooter(msg.content, msg.author.avatarURL)
    );
  } else {
    if (!res.body.list[definition]) {
      definition = res.body.list.length - 1;
    }
    const e = new bot.methods.Embed()
      .setColor(0x1d2439)
      .setAuthor('Urbandictionary',
      'http://www.urbandictionary.com/favicon.ico',
      'http://www.urbandictionary.com/')
      .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
      .setTitle(`${params.join(' ')} [${definition + 1}/${res.body.list.length}]`)
      .setDescription('\u200b');
    const define = res.body.list[definition].definition.match(/(.|[\r\n]){1,1024}/g);
    for (let i = 0; i < define.length; i++) {
      e.addField(i === 0 ? 'Definition' : '\u200b',
        define[i]);
    }
    const example = res.body.list[definition].example.match(/(.|[\r\n]){1,1024}/g);
    if (example) {
      for (let i = 0; i < example.length; i++) {
        e.addField(i === 0 ? 'Beispiel' : '\u200b',
          example[i]);
      }
    } else {
      e.addField('\u200b', '\u200b');
    }
    e.setFooter(`${msg.content} | Definition ${definition + 1} von insgesamt ${res.body.list.length} Definitionen.`, msg.author.avatarURL);
    return msg.channel.sendEmbed(e);
  }
}

exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['urb'],
  permLevel: 0,
};


exports.help = {
  name: 'urban',
  shortdescription: '[Urbandic](urbandictionary.com)(Eng)',
  description: 'Schlägt Begriffe oder Phrasen bei urbandictionary.com nach.',
  usage: '$conf.prefixurban (-Nummer) [Begriff oder Phrase]'
  + '\n Wenn (-Nummer) nicht angegeben wird es das erste nehmen.'
  + '\nBeispiele:'
  + '\n`$conf.prefixurban lol` - Schlägt die erste Definition von `lol` nach.'
  + '\n`$conf.prefixurban -2 lol` - Schlägt die zweite Definition von `lol` nach.',
};
