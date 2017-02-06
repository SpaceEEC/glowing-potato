const moment = require('moment');


exports.run = async (bot, msg, params = []) => { // eslint-disable-line consistent-return
  if (!params[0] || !['info', 'reload', 'add', 'remove'].includes(params[0].toLowerCase())) {
    const quotes = bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id) || q.startsWith('all'));
    if (quotes.size === 0) return msg.channel.sendMessage('Bedauerlicherweise keine Zitate gefunden.');
    return msg.channel.sendEmbed(quotes.random());
  } else if (params[0].toLowerCase() === 'info') {
    return msg.channel.sendMessage(`Insgesamte Zitate: \`${bot.internal.quotes.size}\`
Zitate auf diesem Server: \`${bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id)).size}\``);
  } else if (params[0].toLowerCase() === 'remove' && msg.permlvl >= 5) {
    if (!params[1] || !bot.internal.quotes.has(`${msg.guild.id}|${params[1]}`)) {
      const mes = await msg.channel.sendMessage('Entweder fehlt hier eine ID, oder die Angegebene ID ist ungültig.\nIch bitte um einen weiteren Versuch die ID einzugeben.');
      try {
        const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
        if (bot.internal.quotes.has(`${msg.guild.id}|${collected.first().content}`)) {
          params[1] = collected.first().content;
        } else {
          mes.delete();
          return msg.channel.sendMessage('Breche die Anfrage, aufgrund einer ungültigen Eingabe, ab.');
        }
      } catch (e) {
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      }
    }
    await bot.internal.quote.remove(bot, msg.guild.id, params[1])
      .catch((e) => {
        bot.err(`[quote removeQuote] ${e}`);
        msg.channel.sendMessage(`Es ist ein Fehler beim Löschen des Zitates aufgetreten.\nBitte kontaktiere \`${bot.config.owner}\`.`);
      });
    return msg.channel.sendMessage('Tag erfolgreich gelöscht.');
  } else if (params[0].toLowerCase() === 'add' && msg.permlvl >= 5) {
    if (!['img', 'text'].includes(params[1])) {
      const mes = await msg.channel.sendMessage('Handelt es sich bei diesem Zitat um ein reines Textzitat (text)? Oder beinhaltet es auch ein Bild (img)?');
      try {
        const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
        if (collected.first().content.toLowerCase() === 'img') {
          params[1] = 'img';
        } else if (collected.first().content.toLowerCase() === 'text') {
          params[1] = 'text';
        } else {
          mes.delete();
          return msg.channel.sendMessage('Breche die Anfrage, aufgrund einer ungültigen Eingabe, ab.');
        }
      } catch (e) {
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      }
    }
    if (!params[2] || params[2].search(/\D/g) !== -1) {
      const mes = await msg.channel.sendMessage('Die angegebene ID scheint ungültigt.\nIch bitte um einen weitern Versuch. (Rechtsklick auf die Nachricht -> ID kopieren)');
      try {
        const collected = await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
        if (collected.first().content.search(/\D/g) === -1) {
          params[2] = collected.first().content;
        } else {
          mes.delete();
          return msg.channel.sendMessage('Breche die Anfrage, aufgrund einer ungültigen Eingabe, ab.');
        }
      } catch (e) {
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      }
    }
    // quote in die datenbank aufnehmen

    if (bot.internal.quotes.has(`${msg.guild.id}|${params[2]}`)) {
      return msg.channel.sendMessage('Dieses Zitat existiert bereits!');
    }
    msg.channel.fetchMessage(params[2]).then(mes => {
      mes.guild.fetchMember(mes.author).then(member => {
        if (params[1] === 'text') {
          bot.internal.quote
            .add(bot, mes.guild.id, params[1], mes.id, member.color(),
            `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL, mes.content)
            .then(() => {
              msg.channel.sendMessage('Zitat eingefügt');
            })
            .catch((e) => {
              msg.channel.sendMessage(`Es ist ein Fehler beim Einfügen des Zitates aufgetreten.\nBitte kontaktiere \`${bot.config.owner}\`.`);
              bot.err(`[quote add text] ${e}`);
            });
        } else {
          bot.internal.quote
            .add(bot, mes.guild.id, params[1], mes.id, member.color(),
            `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL,
            mes.content.replace(mes.embeds[0].thumbnail.url, ''), mes.embeds[0].thumbnail.url)
            .then(() => {
              msg.channel.sendMessage('Zitat eingefügt');
            })
            .catch((e) => {
              msg.channel.sendMessage('Es ist ein Fehler beim Einfügen des Zitates aufgetreten.\nBitte kontaktiere `spaceeec#0302`.');
              bot.err(`[quote add img] ${e}`);
            });
        }
      })
        .catch((e) => {
          msg.channel.sendMessage('Es ist ein Fehler beim Abrufen des Zitierten aufgetreten.\nBitte kontaktiere `spaceeec#0302`.');
          bot.err(`[quote fetchMember] ${e}`);
        });
    })
      .catch((error) => {
        msg.channel.sendMessage('Diese ID wurde nicht gefunden.\nBefindet sich diese Nachricht auch in diesem Channel?\n'); // eslint-disable-line
        bot.err(`[quote fetchMessage] ${error}`);
      });
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['zitat', 'quotes', 'zitate'],
  permLevel: 0,
  createLevel: 5,
};


exports.help = {
  name: 'quote',
  description: 'Ruft ein zufälliges Zitat ab oder fügt eines hinzu.',
  shortdescription: 'Zitate',
  usage: '$conf.prefixquote - Ruft ein zufälliges Zitat ab.'
  + '\n$conf.prefixquote <info> - Infos anzeigen.'
  + '\n$conf.prefixquote <add> <text|img> [msg_id] - Fügt ein Zitat mithilfe die Message ID hinzu.'
  + '\n\tBei <img> wird die erste URL im Text als Bild angezeigt.',
};
