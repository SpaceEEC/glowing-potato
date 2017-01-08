exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0] || !['get', 'set', 'reset', 'list', 'show'].includes(params[0])) {
    return menu(bot, msg);
  }
  if (params[0] === 'list') {
    return msg.channel.sendCode('js', require('util').inspect(msg.conf));
  }
  if (!params[1]) {
    return msg.channel.sendMessage('Bitte gib einen Schlüssel an, mit welchem diese Operation ausgeführt werden soll.');
  }
  if (params[0] === 'get') {
    return bot.internal.config.get(bot, msg, params[1]).then(v => msg.channel.sendMessage(v));
  }
  if (params[0] === 'reset') {
    if (['id'].includes(params[1])) {
      return msg.channel.sendMessage('Dieser Schlüssel kann nicht zurückgesetzt werden.');
    }
    if (params[1] === 'name') {
      return bot.internal.config.set(bot, msg, params[1], msg.guild.name).then(r => msg.channel.sendMessage(r))
        .catch((e) => msg.channel.sendMessage(
          `Es ist ein Fehler beim Zurücksetzen des Schlüssels \`${params[1]}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
    }
    return bot.internal.config.reset(bot, msg, params[1]).then(r => msg.channel.sendMessage(r))
      .catch((e) => msg.channel.sendMessage(
        `Es ist ein Fehler beim Zurücksetzen des Schlüssels \`${params[1]}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
  }
  if (params[0] === 'set') {
    if (['ignchannels', 'ignusers'].includes(params[1])) {
      return msg.channel.sendMessage(
        `Zum Ignorieren von Nutzern oder Channeln bitte \`${msg.conf.prefix}ignore\` verwenden.`);
    }
    if (params[1] === 'disabledcommands') {
      return msg.channel.sendMessage(`Zum Deaktivieren von Befehlen bitte \`${msg.conf.prefix}command\` verwenden.`);
    }
    if (params[1] === 'id') {
      return msg.channel.sendMessage('Die `id` ist auf dem neusten Stand.');
    }
    if (params[1] === 'name') {
      return bot.internal.config.set(bot, msg, params[1], msg.guild.name).then(r => msg.channel.sendMessage(r))
        .catch((e) => msg.channel.sendMessage(
          `Es ist ein Fehler beim Zurücksetzen des Schlüssels \`${params[1]}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
    }
    return bot.internal.config.set(bot, msg, params[1], params.slice(2)).then(r => msg.channel.sendMessage(r))
      .catch((e) => msg.channel.sendMessage(
        `Es ist ein Fehler beim Setzen des Schlüssels \`${params[1]}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
  }
});


function menu(bot, msg) {
  let options = new bot.methods.Collection();
  let c = 1;
  for (let key in msg.conf) {
    if (msg.conf.hasOwnProperty(key)) {
      if (!['id', 'name', 'ignchannels', 'ignusers', 'disabledcommands'].includes(key)) {
        options.set(c.toString(), key);
        c++;
      }
    }
  }
  let embed = {
    color: 0x0000FF,
    title: 'Konfigurationsmenü',
    description: `Welchen Wert wünscht du zu ändern?\n\n${options
      .keyArray()
      .map(k => `${k}. ${options.get(k)} - \`${msg.conf[options.get(k)] ?
        msg.conf[options.get(k)].length === 0 ?
          '[]' :
          msg.conf[options.get(k)] :
        msg.conf[options.get(k)]}\``)
      .join('\n')}`,
    fields: [
      {
        name: 'Einfach den Namen oder die Zahl des zu ändernden Objektes angeben.',
        value: 'Zum Abbrechen `cancel` abgeben, oder einfach `30` Sekunden warten.',
      },
    ],
  };
  sendconf(bot, msg, embed, options);
}


const sendconf = (bot, msg, embed, options) => new Promise(() => {
  msg.channel.sendEmbed(embed)
    .then((mes) => {
      mes.channel.awaitMessages(function filter(message, collector) { // eslint-disable-line
        if (message.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          let content = collected.first().content;
          mes.delete();
          if (content === 'cancel') {
            return msg.channel.sendMessage('Vorgang wird abgebrochen...')
              .then(mesg => {
                mesg.delete(2000);
                msg.delete(2000);
                collected.first().delete(2000);
              });
          }
          collected.first().delete();
          if (options.has(content)) {
            content = options.get(content);
          } else if (!(content in msg.conf)) {
            embed.fields[1] = {
              name: 'Diese Eingabe ist ungültig.',
              value: '\u200b',
            };
            return sendconf(bot, msg, embed, options);
          }
          return sendvalue(bot, msg, content);
        }).catch(() => {
          msg.delete();
          mes.delete();
        });
    });
});


const sendvalue = (bot, msg, key) => new Promise(() => {
  bot.internal.config.get(bot, msg, key)
    .then(v => msg.channel.sendMessage(v, {
      embed: {
        color: 0x0000ff,
        fields: [{
          name: 'Bitte einen neuen Wert für diesen Schlüssel eingeben.',
          value: 'Je nach Schlüssel sind ein Text oder die ID (@Mentions oder #Channel sind auch möglich) gültige Werte.' + // eslint-disable-line
          '\n\u200b' +
          '\nZum Löschen `reset` eingeben.' +
          '\nZum Abbrechen `cancel` eingeben.',
        }],
      },
    }).then(mes => {
      mes.channel.awaitMessages(function filter(message, collector) { // eslint-disable-line
        if (message.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          let content = collected.first().content;
          mes.delete();
          if (content === 'cancel') {
            return msg.channel.sendMessage('Vorgang wird abgebrochen...')
              .then(mesg => {
                collected.first().delete(2000);
                mesg.delete(2000);
                msg.delete(2000);
              });
          } else if (content === 'reset') {
            return bot.internal.config.reset(bot, collected.first(), key).then(r => {
              msg.channel.sendMessage(r);
            })
              .catch((e) => msg.channel.sendMessage(
                `Es ist ein Fehler beim Zurücksetzen des Schlüssels \`${key}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
          }
          return bot.internal.config.set(bot, collected.first(), key, content.split(' '))
            .then(r => msg.channel.sendMessage(r))
            .catch((e) => msg.channel.sendMessage(
              `Es ist ein Fehler beim Setzen des Schlüssels \`${key}\` aufgetreten:
\`\`\`js
${e.stack ? e.stack : e}
\`\`\``));
        }).catch(() => {
          msg.delete();
          mes.delete();
        });
    })
    );
});


exports.conf = {
  group: 'Admincommands',
  spamProtection: false,
  enabled: true,
  aliases: ['config'],
  permLevel: 10,
};


exports.help = {
  name: 'conf',
  shortdescription: 'Konfiguration',
  description: 'Mit diesem Befehl ist es möglich den Bot auf dieser Gilde zu konfigurieren.',
  usage: '$conf.prefixconf menu - Interaktives Menü' +
  '\n$conf.prefixconf <list|show> - Zeigt die Konfiguration an.' +
  '\n$conf.prefixconf <get|reset> [Key]' +
  '\n$conf.prefixconf <set> [Key] [Value]',
};
