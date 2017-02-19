const moment = require('moment');

module.exports = class Quote {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line consistent-return
    if (!params[0] || !['info', 'reload', 'add', 'remove'].includes(params[0].toLowerCase())) {
      const quotes = this.bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id) || q.startsWith('all'));
      if (quotes.size === 0) return msg.channel.sendMessage('Bedauerlicherweise keine Zitate gefunden.');
      return msg.channel.sendEmbed(quotes.random());
    } else if (params[0].toLowerCase() === 'info') {
      return msg.channel.sendMessage(`Insgesamte Zitate: \`${this.bot.internal.quotes.size}\`
Zitate auf diesem Server: \`${this.bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id)).size}\``);
    } else if (params[0].toLowerCase() === 'remove' && msg.permlvl >= 5) {
      if (!params[1] || !this.bot.internal.quotes.has(`${msg.guild.id}|${params[1]}`)) {
        return msg.channel.sendMessage('Entweder fehlt hier eine ID, oder die Angegebene ID ist ungültig.');
      }
      await this.bot.internal.quote.remove(this.bot, msg.guild.id, params[1]);
      return msg.channel.sendMessage('Tag erfolgreich gelöscht.');
    } else if (params[0].toLowerCase() === 'add' && msg.permlvl >= 5) {
      if (!['img', 'text'].includes(params[1])) {
        const mes = await msg.channel.sendMessage('Handelt es sich bei diesem Zitat um ein reines Textzitat (text)? Oder beinhaltet es auch ein Bild (img)?');
        const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
        if (!collected) return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
        if (collected.content.toLowerCase() === 'img') {
          params[1] = 'img';
        } else if (collected.content.toLowerCase() === 'text') {
          params[1] = 'text';
        } else {
          mes.delete();
          return msg.channel.sendMessage('Breche die Anfrage, aufgrund einer ungültigen Eingabe, ab.');
        }
      }
      if (!params[2] || params[2].search(/\D/g) !== -1) {
        const mes = await msg.channel.sendMessage('Die angegebene ID scheint ungültigt.\nIch bitte um einen weiteren Versuch. (Rechtsklick auf die Nachricht -> ID kopieren)');
        const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
        if (!collected) return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
        if (collected.content.search(/\D/g) === -1) {
          params[2] = collected.content;
        } else {
          mes.delete();
          return msg.channel.sendMessage('Breche die Anfrage, aufgrund einer ungültigen Eingabe, ab.');
        }
      }
      if (this.bot.internal.quotes.has(`${msg.guild.id}|${params[2]}`)) {
        return msg.channel.sendMessage('Dieses Zitat existiert bereits!');
      }
      msg.channel.fetchMessage(params[2]).then(mes => {
        mes.guild.fetchMember(mes.author).then(member => {
          if (params[1] === 'text') {
            this.bot.internal.quote
              .add(this.bot, mes.guild.id, params[1], mes.id, member.color(),
              `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL, mes.content)
              .then(() => {
                msg.channel.sendMessage('Zitat eingefügt');
              })
              .catch((e) => {
                msg.channel.sendMessage(`Es ist ein Fehler beim Einfügen des Zitates aufgetreten.\nBitte kontaktiere \`${this.bot.config.owner}\`.`);
                this.bot.err(`[quote add text] ${e}`);
              });
          } else {
            this.bot.internal.quote
              .add(this.bot, mes.guild.id, params[1], mes.id, member.color(),
              `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL,
              mes.content.replace(mes.embeds[0].thumbnail.url, ''), mes.embeds[0].thumbnail.url)
              .then(() => {
                msg.channel.sendMessage('Zitat eingefügt');
              })
              .catch((e) => {
                msg.channel.sendMessage('Es ist ein Fehler beim Einfügen des Zitates aufgetreten.\nBitte kontaktiere `spaceeec#0302`.');
                this.bot.err(`[quote add img] ${e}`);
              });
          }
        })
          .catch((e) => {
            msg.channel.sendMessage(`Es ist ein Fehler beim Abrufen des Zitierten aufgetreten.\nBitte kontaktiere \`\`.`);
            this.bot.err(`[quote fetchMember] ${e}`);
          });
      })
        .catch((error) => {
          msg.channel.sendMessage('Diese ID wurde nicht gefunden.\nBefindet sich diese Nachricht auch in diesem Channel?\n');
          this.bot.err(`[quote fetchMessage] ${error}`);
        });
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['zitat', 'quotes', 'zitate'],
      permLevel: 0,
      createLevel: 5,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'quote',
      description: 'Ruft ein zufälliges Zitat ab oder fügt eines hinzu.',
      shortdescription: 'Zitate',
      usage: '$conf.prefixquote - Ruft ein zufälliges Zitat ab.'
      + '\n$conf.prefixquote <info> - Infos anzeigen.'
      + '\n$conf.prefixquote <add> <text|img> [msg_id] - Fügt ein Zitat mithilfe die Message ID hinzu.'
      + '\n\tBei <img> wird die erste URL im Text als Bild angezeigt.',
    };
  }
};
