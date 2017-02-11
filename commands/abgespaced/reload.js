const fs = require('fs-extra-promise');


exports.run = async (bot, msg, params = []) => {
  if (!params[0]) {
    msg.channel.sendMessage('Keinen Befehl zum neu Laden angegeben.');
  } else {
    reload(bot, msg, params);
  }
};


async function reload(bot, msg, params) {
  if (params[0] === 'all') {
    const folders = await fs.readdirAsync('./commands/');
    bot.log(`Lade insgesamt ${folders.length} Befehlskategorien.`);
    await folders.forEach(async folder => {
      const files = await fs.readdirAsync(`./commands/${folder}`);
      bot.log(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
      await files.forEach(f => {
        try {
          const props = require(`../commands/${folder}/${f}`);
          if (props.help.shortdescription.length === 0) props.conf.group = 'hidden';
          else props.conf.group = folder;
          bot.commands.set(props.help.name, props);
          props.conf.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
          });
        } catch (e) {
          bot.err(`Fehler beim Laden von ./commands/${folder}/${f}.js\n${e.stack ? e.stack : e}`);
        }
      });
    });
  } else {
    for (let i = 0; i < params.length; i++) {
      bot.internal.commands.reload(bot, params[i]).then(cmd => {
        bot.log(`"./commands/${cmd.conf.group}/${params[i]}.js" erfolgreich neu geladen.`);
        msg.channel.sendMessage(`Neu laden von \`${params[i]}\` erfolgreich abgeschlossen.`);
      })
        .catch((err) => {
          if (err.message.startsWith('Cannot find module ')) {
            msg.channel.sendMessage(`Konnte die Datei \`${params[i]}.js\` nicht finden.\nVerwendest du einen Alias? 👀`);
          } else {
            bot.err(`Es ist ein Fehler beim neu Laden von ${params[i]} aufgetreten:\n${err.stack ? err.stack : err}`);
            msg.channel.sendMessage(`Es ist ein Fehler beim neu Laden von \`${params[i]}\` aufgetreten.`);
          }
        });
    }
  }
  return 'end-of-function';
}


exports.conf = {
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
