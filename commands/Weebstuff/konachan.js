const request = require('superagent');

module.exports = class Konachan {
  constructor(bot) {
    this.bot = bot;
  }

  async run(msg, params = []) { // eslint-disable-line consistent-return
    if (!params[0]) {
      const mes = await msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(msg.member.highestRole.color)
        .setDescription(`Also suchen wir heute nach einem Bild?
Dazu benötige ich mindestens einen Suchbegriff (Tag)`)
        .addField('\u200b', 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um abzubrechen.'));
      try {
        const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
        mes.delete();
        if (collected.content === 'cancel') {
          collected.delete();
          msg.delete();
        } else {
          this.prepare(msg, collected.content.split(' '));
        }
      } catch (e) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
      }
    } else {
      this.prepare(msg, params);
    }
  }


  prepare(bot, msg, params) {
    if (msg.cmd === 'donmai' && typeof params[2] !== 'undefined') {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .setDescription('Donmai erlaubt nur `2` Tags.\nKonachan hingegen erlaubt `5`.')
      );
    }
    if (msg.cmd === 'konachan' && typeof params[4] !== 'undefined') {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .setDescription('Konachan erlaubt nur `5` Tags.')
      );
    }

    // Regex-magic
    if (!params.join('+').match(/^[a-z0-9_=()!-:.]+$/i)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .setDescription('Nicht erlaubtes Zeichen in der Suche!')
        .addField('Erlaubte Zeichen:', 'A-z 0-9 _ = () ! - : .', true)
        .addField('Fehlendes Zeichen?', `${bot.users.get('218348062828003328').toString()} anschreiben`, true)
      );
    }
    //
    if (msg.cmd === 'donmai') {
      return this.donmai(bot, msg, params);
    } else if (msg.cmd === 'konachan') {
      return this.konachan(bot, msg, params);
    } else {
      return msg.channel.sendMessage(`Das hier sollte eigentlich nie passieren, aber: ${params[0]}`);
    }
  }


  async konachan(bot, msg, params = []) {
    const res = await request.get(`http://konachan.com/post.json?tags=${`${params.join('+')}+rating:s&limit=100`}`)
      .send(null)
      .set('Accept', 'application/json');
    if (Array.from(res.body).length === 0) {
      return msg.channel.sendEmbed({
        color: 0xFFFF00,
        author: {
          name: 'konachan.net',
          url: 'http://konachan.net/',
          icon_url: 'http://konachan.net/favicon.ico',
        },
        fields: [
          {
            name: 'Keine Ergebnisse',
            value: 'Vielleicht einen Tippfehler gemacht?',
          },
          {
            name: 'Suche:',
            value: `[Link](http://konachan.net/post?tags=${params.join('+')})`,
          },
        ],
      });
    }
    const image = res.body[Math.floor(Math.random() * (res.body.length - 0)) + 0];
    return msg.channel.sendEmbed({
      description: `[Source](http://konachan.net/post/show/${image.id})`,
      color: msg.guild.member(msg.author).highestRole.color,
      type: 'image',
      image: { url: `http:${image.sample_url}` },
    }).catch((e) => {
      msg.channel.sendCode(bot.inspect(image));
      return msg.channel.sendCode('js', e.stack);
    });
  }


  async donmai(bot, msg, params = []) {
    const res = await request.get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${params.join('+')}`)
      .send(null)
      .set('Accept', 'application/json');
    if (res.body.success === false) return msg.channel.sendMessage(`Der Server meldet:\n\`${res.body.message}\``);
    if (res.body.length === 0) {
      return msg.channel.sendEmbed({
        color: 0xFFFF00,
        author: {
          name: 'safebooru.donmai.us',
          url: 'http://safebooru.donmai.us/',
          icon_url: 'http://safebooru.donmai.us/favicon.ico',
        },
        fields: [
          {
            name: 'Keine Ergebnisse',
            value: 'Vielleicht einen Tippfehler gemacht?',
          },
          {
            name: 'Suche:',
            value: `[Link](http://safebooru.donmai.us/posts/?tags=${params.join('+')})`,
          },
        ],
      });
    }
    return msg.channel.sendEmbed({
      description: `[Source](http://safebooru.donmai.us/posts/${res.body[0].id}/)`,
      color: msg.guild.member(msg.author).highestRole.color,
      type: 'image',
      image: { url: `http://safebooru.donmai.us/${res.body[0].file_url}` },
    });
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['donmai'],
      permLevel: 1,
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
