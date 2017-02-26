const request = require('superagent');

module.exports = class Konachan {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0]) {
      const mes = await msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(msg.member.highestRole.color)
        .setDescription(`Also suchen wir heute nach einem Bild?
Dazu benötige ich mindestens einen Suchbegriff (Tag)`)
        .addField('\u200b', 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um abzubrechen.'));
      const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      mes.delete();
      if (!collected) return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
      if (collected.content === 'cancel') {
        collected.delete();
        return msg.delete();
      }
    }
    return this.prepare(msg, params);
  }


  prepare(msg, params) {
    if (msg.cmd === 'donmai' && params[2]) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xff0000).setDescription('Donmai erlaubt nur `2` Tags.')
      );
    } if (msg.cmd === 'konachan' && params[4]) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xff0000).setDescription('Konachan erlaubt nur `5` Tags.')
      );
    }
    
    if (!params.join('+').match(/^[a-z0-9_=()!-:.]+$/i)) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xff0000)
        .setDescription('Nicht erlaubtes Zeichen in der Suche!')
        .addField('Erlaubte Zeichen:', 'A-z 0-9 _ = () ! - : .', true)
        .addField('Fehlendes Zeichen?', `${this.bot.users.get('218348062828003328').toString()} anschreiben`, true)
      );
    }

    if (msg.cmd === 'donmai') return this.donmai(msg, params);
    return this.konachan(msg, params);
  }


  async konachan(msg, params = []) {
    const res = await request.get(`http://konachan.com/post.json?tags=${`${params.join('+')}+rating:s&limit=100`}`)
      .send(null).set('Accept', 'application/json');
    if (res.body.length === 0) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed().setColor(0xFFFF00)
        .setAuthor('konachan.net', 'http://konachan.net/', 'http://konachan.net/favicon.ico')
        .addField('Keine Ergebnisse', 'Vielleicht einen Tippfehler gemacht?')
        .addField('Suche:', `[Link](http://konachan.net/post?tags=${params.join('+')})`));
    }
    const image = res.body[Math.floor(Math.random() * (res.body.length - 0)) + 0];
    return msg.channel.sendEmbed(new this.bot.methods.Embed()
      .setColor(msg.member.color()).setImage(`http:${image.sample_url}`))
      .setDescription(`[Source](http://konachan.net/post/show/${image.id})`);
  }


  async donmai(msg, params = []) {
    const res = await request.get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${params.join('+')}`)
      .send(null).set('Accept', 'application/json');
    if (res.body.success === false) return msg.channel.sendMessage(`Der Server meldet:\n\`${res.body.message}\``);
    if (res.body.length === 0) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed().setColor(0xFFFF00)
        .setAuthor('safebooru.donmai.us', 'http://safebooru.donmai.us/', 'http://safebooru.donmai.us/favicon.ico')
        .addField('Keine Ergebnisse', 'Vielleicht einen Tippfehler gemacht?')
        .addField('Suche:', `[Link](http://safebooru.donmai.us/posts/?tags=${params.join('+')})`));
    }
    return msg.channel.sendEmbed(new this.bot.methos.Embed().setColor(msg.member.color())
      .setDescription(`[Source](http://safebooru.donmai.us/posts/${res.body[0].id}/)`)
      .setImage(`http://safebooru.donmai.us/${res.body[0].file_url}`));
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['donmai'],
      permLevel: 1,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'konachan',
      description: 'Über diesen Befehl kann von safebooru.donmai.us/konachan.net ein zufälliges (durch Tags spezifiziertes) Bild abgerufen werden.', // eslint-disable-line
      shortdescription: 'bzw. `$conf.prefixdonmai`',
      usage: '`$conf.prefixkonachan [tags mit Leerzeichen trennen.]'
      + '\n$conf.prefixdonmai [tags mit Leerzeichen trennen]`'
      + '\nAnwendungsbeispiel:'
      + '\n`$conf.prefixkonachan polychromatic white`'
      + '\n`$conf.prefixbild donmai touhou long_hair`',
    };
  }
};
