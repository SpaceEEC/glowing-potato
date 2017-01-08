const fs = require('fs-extra-promise');


exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0]) {
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(msg.member.highestRole.color)
      .setDescription('Gib die Befehle die du neu Laden möchtest ein, oder `all` für alle.')
      .addField('\u200b',
      'Diese Anfrage wird in 30 Sekunden oder bei Eingabe von `cancel` abgebrochen.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      msg.author.avatarURL)
    ).then(message => {
      msg.channel.awaitMessages(function filter(message, collector) { // eslint-disable-line
        if (message.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          let mesg = collected.first();
          message.delete();
          if (mesg.content === 'cancel') {
            msg.delete();
            mesg.delete();
          } else {
            reload(bot, mesg, mesg.content.split(' '));
          }
        }
        ).catch(() => {
          message.delete();
          msg.delete();
        });
    });
  }
  return reload(bot, msg, params);
});


const reload = (bot, msg, params) => new Promise(() => {
  if (params[0] === 'all') {
    msg.channel.sendMessage('Lade alle Befehle neu, dies kann ein wenig dauern.').then(mes => {
      fs.readdir(`./commands/`, (erro, files) => { // eslint-disable-line
        let error = false;
        files.forEach(f => {
          bot.internal.commands.reload(bot, f.replace('.js', '')).catch((err) => {
            error = true;
            bot.err(`Fehler beim neu Laden von ${f}:\n${err.stack ? err.stack : err}`);
          });
        });
        if (error) {
          bot.log('Das neu Laden aller Befehle ist mit Fehlern abgeschlossen.');
          return mes.edit('Es ist beim Laden mindstens einem Befehl ein Fehler aufgetreten.');
        } else {
          bot.log('Alle Befehle neu geladen.');
          return mes.edit('Alle Befehle ohne Fehler neu geladen.');
        }
      });
    });
  } else {
    for (let i = 0; i < params.length; i++) {
      bot.internal.commands.reload(bot, params[i]).then(mi => { // eslint-disable-line
        bot.log(`"${params[i]}.js" erfolgreich neu geladen.`);
        msg.channel.sendMessage(`Neu laden von \`${params[i]}\` erfolgreich abgeschlossen.`);
      })
        .catch((err) => {
          bot.err(`Es ist ein Fehler beim neu Laden von ${params[i]} aufgetreten:\n${err.stack ? err.stack : err}`);
          msg.channel.sendMessage(`Es ist ein Fehler beim neu Laden von \`${params[i]}\` aufgetrten.`);
        });
    }
  }
});


exports.conf = {
  group: 'abgespaced',
  spamProtection: false,
  enabled: true,
  aliases: ['relaod'],
  permLevel: 12,
};


exports.help = {
  name: 'reload',
  shortdescription: 'Neu laden',
  description: 'Lädt den angegebenen oder alle Befehl neu.',
  usage: '$conf.prefixreload\n$conf.prefixreload [Command]\n$conf.prefixreload all',
};
