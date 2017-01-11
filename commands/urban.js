const request = require('superagent');


exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0]) {
    return msg.channel.sendEmbed({
      title: 'Was soll ich Nachschlagen?',
      description: 'Bedenke, dass du mit `-Nummer` (Nummer mit einer Zahl ersetzen)' +
      '\nweitere Definitionen nachschlagen kannst.',
      fields: [
        {
          name: `\u200b`,
          value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
        }],
      color: msg.member.highestRole.color,
    }).then((mes) => {
      msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
        if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] }
      ).then(collected => {
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
      }).catch(err => {
        if (err.size) {
          msg.delete();
          mes.delete();
        } else {
          bot.err(err.stack ? err.stack : err);
        }
      });
    });
  } else if (params[0].match(/^-\d+$/g)) {
    query(bot, msg, params.slice(1), params[0].replace('-', ''));
  } else {
    query(bot, msg, params, 1);
  }
});


function query(bot, msg, params, definition) {
  request.get(`http://api.urbandictionary.com/v0/define?term=${params.join(' ')}`)
    .send(null)
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      if (err) {
        return bot.err(require('util').inspect(err));
      }
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
        return msg.channel.sendEmbed(
          new bot.methods.Embed()
            .setColor(0x1d2439)
            .setAuthor('Urbandictionary',
            'http://www.urbandictionary.com/favicon.ico',
            'http://www.urbandictionary.com/')
            .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
            .setTitle(`${params.join(' ')} [${definition + 1}/${res.body.list.length}]`)
            .setDescription('\u200b')
            .addField('Definition:', res.body.list[definition].definition)
            .addField('Beispiel:', res.body.list[definition].example)
            .setFooter(msg.content, msg.author.avatarURL)
        );
      }
    });
}


exports.conf = {
  group: 'Sonstiges',
  spamProtection: false,
  enabled: true,
  aliases: ['urb'],
  permLevel: 0,
};


exports.help = {
  name: 'urban',
  shortdescription: '[Urbandic](urbandictionary.com)(Eng)',
  description: 'Schlägt Begriffe oder Phrasen bei urbandictionary.com nach.',
  usage: '$conf.prefixurban (-Nummer) [Begriff oder Phrase]' +
  '\n Wenn (-Nummer) nicht angegeben wird es das erste nehmen.' +
  '\nBeispiele:' +
  '\n`$conf.prefixurban lol` - Schlägt die erste Definition von `lol` nach.' +
  '\n`$conf.prefixurban -2 lol` - Schlägt die zweite Definition von `lol` nach.',
};
