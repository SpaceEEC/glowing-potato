// Much thanks to Kurisu (http://kurisubrooks.com/) for the API!
const request = require('superagent');

module.exports = class Translate {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    const obj = {};
    if (!params[0]) {
      let mes = await msg.channel.sendMessage('Welche Sprache möchtest du übersetzen? (Bitte mit der zweistelligen Abkürzung dafür angeben)');
      let collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      mes.delete();
      if (!collected) return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
      if (!this.langs(collected.content.split(' ')[0])) return msg.channel.sendMessage('Diese Sprache ist ungültig, breche die Anfrage ab.').then(m => m.delete(5000));
      params[0] = `-${collected.content.split(' ')[0]}`;
      mes = await msg.channel.sendMessage('Welcher Text soll denn übersetzt werden? (Optional eine Quellsprache mit `-xx` angeben, falls gewünscht)');
      collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      mes.delete();
      if (!collected) return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
      params = params.concat(collected.content.split(' '));
    }
    if (!params[1]) return msg.channel.sendMessage('Diesem Befehl fehlt es an etwas.');
    if (params[0].match(/^-..$/g)) {
      obj.to = params.shift().replace('-', '');
      if (!this.langs(obj.to)) return msg.channel.sendMessage(`Unbekannte Sprache \`${obj.to}\`!`);
    }
    if (params[0].match(/^-..$/)) {
      obj.from = params.shift().replace('-', '');
      if (!this.langs(obj.from)) return msg.channel.sendMessage(`Unbekannte Sprache \`${obj.from}\`!`);
    }
    if (!params[0]) return msg.channel.sendMessage('Fehlendes Argument!');
    obj.query = params.join(' ');
    const res = await request.post(`https://api.kurisubrooks.com/api/translate`)
      .send(obj)
      .set('Content-Type', 'application/json');
    if (res.body.ok) {
      return msg.channel.sendEmbed(
        new this.bot.methods.Embed()
          .setColor(0xb89bf8)
          .setAuthor(`API von Kurisu`, 'http://kurisubrooks.com/favicon.ico', 'http://kurisubrooks.com/')
          .addField(`Von ${res.body.from.name} (${res.body.from.local})`, res.body.query)
          .addField(`In ${res.body.to.name} (${res.body.to.local})`, res.body.result));
    } else {
      return msg.channel.sendMessage(`Es ist ein Fehler beim Abrufen der Übersetzung aufgetreten:
\`\`\`LDIF
${res.body.error}
\`\`\``);
    }
  }

  // Are all of them even supported by Kurisu?
  langs(lang) {
    return ['af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bn', 'bs', 'bg', 'ca',
      'ceb', 'ny', 'zh-CN', 'zh-TW', 'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 'tl', 'fi',
      'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw', 'iw', 'hi', 'hmn', 'hu', 'is',
      'ig', 'id', 'ga', 'it', 'ja', 'jw', 'kn', 'kk', 'km', 'ko', 'ku', 'ky', 'lo', 'la', 'lv',
      'lt', 'lb', 'mk', 'mg', 'ms', 'ms', 'ml', 'mi', 'mr', 'mn', 'my', 'ne', 'no', 'ps', 'fa',
      'pl', 'pt', 'ma', 'ro', 'ru', 'sm', 'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es',
      'su', 'sw', 'sv', 'tg', 'ta', 'te', 'th', 'tr', 'uk', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu'].includes(lang);
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: false,
      aliases: [],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }

  static get help() {
    return {
      name: 'translate',
      description: 'Übersetzt Text oder Wörter in andere Sprachen.'
      + '\n\u200b'
      + '\nDie "von" Sprache ist optional. Falls diese nicht angegeben wurde, wird automatisch versucht, die korrekte Sprache zu erkennen.'
      + '\n\u200b'
      + '\nGib die Sprachen in einer zweistelligen Abkürzung dafür an. [Link](https://cloud.google.com/translate/docs/languages)'
      + '\n\u200b',
      shortdescription: 'Übersetzt',
      usage: '$conf.prefixtranslate [-in] (-von) [Text]',
    };
  }
};
