const request = require('superagent');

module.exports = class Urban {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0]) {
      const mes = await msg.channel.sendEmbed(new this.bot.methods.Embed().setTitle('Was soll den nachgeschlagen werden?')
        .setDescription('Bedenke, dass mit `-n` (n als Zahl)\nweitere Definitionen angezeigt werden können.')
        .addField('\u200b', 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.')
        .setColor(msg.member.color()));
      const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      mes.delete();
      if (!collected) return msg.delete();
      if (collected.content === 'cancel') {
        collected.first().delete();
        return msg.delete();
      } else if (collected.content.split(' ')[0].match(/^-\d+$/g)) {
        return this.query(msg, params.slice(1), params[0].replace('-', ''));
      } else {
        return this.query(msg, collected.content.split(' '), 1);
      }
    } else if (params[0].match(/^-\d+$/g)) {
      return this.query(msg, params.slice(1), params[0].replace('-', ''));
    } else {
      return this.query(msg, params, 1);
    }
  }


  async query(msg, params, definition) {
    const res = await request.get(`http://api.urbandictionary.com/v0/define?term=${params.join(' ')}`)
      .send(null).set('Content-Type', 'application/json');
    definition = parseInt(definition) - 1;
    if (res.body.list.length === 0) {
      return msg.channel.sendEmbed(
        new this.bot.methods.Embed()
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
      const e = new this.bot.methods.Embed()
        .setColor(0x1d2439)
        .setAuthor('Urbandictionary',
        'http://www.urbandictionary.com/favicon.ico',
        'http://www.urbandictionary.com/')
        .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
        .setTitle(`${params.join(' ')} [${definition + 1}/${res.body.list.length}]`)
        .setDescription('\u200b');
      const define = res.body.list[definition].definition.match(/(.|[\r\n]){1,1024}/g);
      for (let i = 0; i < define.length; i++) { e.addField(i === 0 ? 'Definition' : '\u200b', define[i]); }
      const example = res.body.list[definition].example.match(/(.|[\r\n]){1,1024}/g);
      if (example) {
        for (let i = 0; i < example.length; i++) e.addField(i === 0 ? 'Beispiel' : '\u200b', example[i]);
      } else { e.addField('\u200b', '\u200b'); }
      e.setFooter(`${msg.content} | Definition ${definition + 1} von insgesamt ${res.body.list.length} Definitionen.`, msg.author.avatarURL);
      return msg.channel.sendEmbed(e);
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['urb'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'urban',
      shortdescription: 'Urbandic(Englisch)',
      description: 'Schlägt Begriffe oder Phrasen bei urbandictionary.com nach.',
      usage: '$conf.prefixurban (-Nummer) [Begriff oder Phrase]'
      + '\n Wenn (-Nummer) nicht angegeben wird es das erste nehmen.'
      + '\nBeispiele:'
      + '\n`$conf.prefixurban lol` - Schlägt die erste Definition von `lol` nach.'
      + '\n`$conf.prefixurban -2 lol` - Schlägt die zweite Definition von `lol` nach.',
    };
  }
};
