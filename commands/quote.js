const moment = require('moment');

exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  /* if (!['216642768909500416', '243175181885898762'].includes(msg.guild.id)) {
    return msg.channel.sendMessage('Dieser Befehl ist noch nicht Global aktiv.');
  }*/
  if (!params[0]) {
    // quote holen und als Embed schicken
    const quotes = bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id) || q.startsWith('all'));
    if (quotes.size === 0) return msg.channel.sendMessage('Keine Quotes gefunden.');
    return msg.channel.sendEmbed(quotes.random());
  } else if (params[0] === 'info') {
    // stats holen und schicken
    return msg.channel.sendMessage(`Geladene Zitate: ${bot.internal.quotes.size}`);
  } else if (params[0] === 'reload') {
    if (msg.permlvl < 12) {
      return msg.channel.sendMessage('Du hast keine Rechte diesen Befehl zu nutzen.');
    } else {
      bot.internal.quotes = new bot.methods.Collection();
      exports.init(bot).then(() => {
        msg.channel.sendMessage(`Neu geladene Zitate: ${bot.internal.quotes.size}`);
      }).catch((error) => msg.channel.sendCode('js', error));
    }
  } else if (params[0] === 'add') {
    // quote in die datenbank aufnehmen
    let msgid;
    let type;
    if (params[1] === 'img') {
      msgid = params[2];
      type = 'img';
    } else if (params[1] === 'text') {
      msgid = params[2];
      type = 'text';
    } else {
      return msg.channel.sendMessage(
        'Bitte gib an ob es sich, bei diesem Zitat um ein `text` oder `img`(Bild) handelt.');
    }
    if (bot.quotes.has(`${msg.guild.id}|${msgid}`)) return msg.channel.sendMessage('Dieses Zitat existiert bereits!');
    msg.channel.fetchMessage(msgid).then(mes => {
      if (type === 'text') {
        bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description) VALUES (?, ?, ?, ?, ?, ?)`, [ // eslint-disable-line
          mes.guild.id,
          type,
          mes.id,
          msg.member.highestRole.color,
          `${mes.author.username} (${moment().format('DD-MM-YYYY')})`,
          mes.author.avatarURL,
          mes.content]);
        bot.internal.quotes.set(`${mes.guild.id}|${mes.id}`, {
          color: mes.member.highestRole.color,
          fields: [
            {
              name: '\u200b',
              value: mes.content,
            },
          ],
          footer: {
            text: `${mes.author.username} (${moment().format('DD-MM-YYYY')})`,
          },
          thumbnail: {
            url: mes.author.avatarURL,
          },
        });
      } else if (type === 'img') {
        bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (?, ?, ?, ?, ?, ?, ?)`, [ // eslint-disable-line
          mes.guild.id,
          type,
          mes.id,
          msg.member.highestRole.color,
          `${mes.author.username} (${moment().format('DD-MM-YYYY')})`,
          mes.author.avatarURL,
          mes.content.replace(mes.embeds[0].thumbnail.url, ''),
          mes.embeds[0].thumbnail.url]);
        bot.internal.quotes.set(`${mes.guild.id}|${mes.id}`, {
          color: mes.member.highestRole.color,
          description: mes.content.replace(mes.embeds[0].thumbnail.url, ''),
          footer: {
            text: `${mes.author.username} (${moment().format('DD-MM-YYYY')})`,
            icon_url: mes.author.avatarURL,
          },
          type: 'image',
          image: {
            url: mes.embeds[0].thumbnail.url,
          },
        });
      }
      return msg.channel.sendMessage('Zitat eingefügt');
    }).catch((error) => {
      msg.channel.sendMessage('Diese ID wurde nicht gefunden.\nBefindet sich diese Nachricht auch in diesem Channel?\n'); // eslint-disable-line
      bot.err(error);
    });
  } else {
    // quote holen und als Embed schicken
    msg.channel.sendEmbed(bot.internal.quotes.random());
  }
});


exports.init = (bot) => new Promise((resolve, reject) => {
  bot.db.all(`SELECT * FROM quotes`).then(rows => {
    rows.map(quote => { // eslint-disable-line
      if (quote.type === 'text') {
        bot.internal.quotes.set(`${quote.guild}|${quote.id}`, {
          color: quote.color,
          fields: [
            {
              name: '\u200b',
              value: quote.description,
            },
          ],
          footer: {
            text: quote.name,
          },
          thumbnail: {
            url: quote.icon_url,
          },
        });
      } else if (quote.type === 'img') {
        bot.internal.quotes.set(`${quote.guild}|${quote.id}`, {
          color: quote.color,
          description: quote.description,
          footer: {
            text: quote.name,
            icon_url: quote.icon_url,
          },
          type: 'image',
          image: {
            url: quote.img,
          },
        });
      }
    });
    resolve();
  }).catch((error) => {
    reject(error);
  });
});

exports.conf = {
  group: 'Allgemeines',
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
  usage: '$conf.prefixquote - Ruft ein zufälliges Zitat ab.' +
  '\n$conf.prefixquote <reload|info> - Neu laden oder Infos anzeigen.' +
  '\n$conf.prefixquote <add> <text|img> [msg_id] - Fügt ein Zitat mithilfe die Message ID hinzu.' +
  '\n\tBei <img> wird die erste URL im Text als Bild angezeigt.',
};
