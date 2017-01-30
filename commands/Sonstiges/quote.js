const moment = require('moment');


exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0] || !['info', 'reload', 'add'].includes(params[0])) {
    // quote holen und als Embed schicken
    const quotes = bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id) || q.startsWith('all'));
    if (quotes.size === 0) return msg.channel.sendMessage('Keine Quotes gefunden.');
    return msg.channel.sendEmbed(quotes.random());
  } else if (params[0] === 'info') {
    // stats holen und schicken
    return msg.channel.sendMessage(`Globale Zitate: \`${bot.internal.quotes.size}\`
Zitate auf diesem Server: \`${bot.internal.quotes.filter((w, q) => q.startsWith(msg.guild.id)).size}\``);
  } else if (params[0] === 'reload') {
    if (msg.permlvl < 12) {
      return msg.delete();
    } else {
      bot.internal.quote.init(bot).then(() => {
        msg.channel.sendMessage(`Neu geladene Zitate: ${bot.internal.quotes.size}`);
      }).catch((error) => msg.channel.sendCode('js', error));
    }
  } else if (params[0] === 'add') {
    if (!['img', 'text'].includes(params[1])) {
      return msg.channel.sendMessage(
        'Bitte gib an ob es sich, bei diesem Zitat um ein `text` oder `img`(Bild) handelt.');
    }
    // quote in die datenbank aufnehmen

    if (bot.internal.quotes.has(`${msg.guild.id}|${params[2]}`)) {
      return msg.channel.sendMessage('Dieses Zitat existiert bereits!');
    }
    msg.channel.fetchMessage(params[2]).then(mes => {
      if (params[1] === 'text') {
        return bot.internal.quote
          .add(bot, mes.guild.id, params[1], mes.id, mes.member.highestRole.color,
          `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL, mes.content)
          .then(() => {
            msg.channel.sendMessage('Zitat eingefügt');
          })
          .catch((e) => {
            msg.channel.sendMessage(`Interner Fehler beim einfügen des Zitats aufgetreten:
\`\`\`js\n${e.stack ? e.stack : e}\`\`\``);
          });
      } else {
        return bot.internal.quote
          .add(bot, mes.guild.id, params[1], mes.id, mes.member.highestRole.color,
          `${mes.author.username} (${moment().format('DD.MM.YYYY')})`, mes.author.avatarURL,
          mes.content.replace(mes.embeds[0].thumbnail.url, ''), mes.embeds[0].thumbnail.url)
          .then(() => {
            msg.channel.sendMessage('Zitat eingefügt');
          })
          .catch((e) => {
            msg.channel.sendMessage(`Interner Fehler beim einfügen des Zitats aufgetreten:
\`\`\`js\n${e.stack ? e.stack : e}\`\`\``);
          });
      }
    }).catch((error) => {
      msg.channel.sendMessage('Diese ID wurde nicht gefunden.\nBefindet sich diese Nachricht auch in diesem Channel?\n'); // eslint-disable-line
      bot.err(`[quote fetchMessage] ${error}`);
    });
  }
});


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
  + '\n$conf.prefixquote <reload|info> - Neu laden oder Infos anzeigen.'
  + '\n$conf.prefixquote <add> <text|img> [msg_id] - Fügt ein Zitat mithilfe die Message ID hinzu.'
  + '\n\tBei <img> wird die erste URL im Text als Bild angezeigt.',
};
