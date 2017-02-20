const fs = require('fs-extra-promise');

module.exports = class Eval {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0]) {
      msg.channel.sendMessage('Keinen Befehl zum neu Laden angegeben.');
    } else {
      this.reload(msg, params);
    }
  }


  async reload(msg, params = []) {
    if (params[0] === 'all') {
      const folders = await fs.readdirAsync('./commands/');
      this.bot.log(`Lade insgesamt ${folders.length} Befehlskategorien.`);
      await folders.forEach(async folder => {
        const files = await fs.readdirAsync(`./commands/${folder}`);
        this.bot.log(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
        await files.forEach(f => {
          try {
            const props = require(`../commands/${folder}/${f}`);
            this.bot.commands.set(props.help.name, props);
            props.conf.aliases.forEach(alias => {
              this.bot.aliases.set(alias, props.help.name);
            });
          } catch (e) {
            this.bot.err(`Fehler beim Laden von ./commands/${folder}/${f}.js\n${e.stack ? e.stack : e}`);
          }
        });
      });
    } else {
      for (let i = 0; i < params.length; i++) {
        this.bot.internal.commands.reload(this.bot, params[i]).then(cmd => {
          this.bot.log(`"./commands/${cmd.conf.group}/${params[i]}.js" erfolgreich neu geladen.`);
          msg.channel.sendMessage(`Neu laden von \`${params[i]}\` erfolgreich abgeschlossen.`);
        })
          .catch((err) => {
            console.log(err);
            if (err.message.startsWith('Cannot find module ')) {
              msg.channel.sendMessage(`Konnte die Datei \`${params[i]}.js\` nicht finden.\nVerwendest du einen Alias? 👀`);
            } else {
              this.bot.err(`Es ist ein Fehler beim neu Laden von ${params[i]} aufgetreten:\n${err.stack ? err.stack : err}`);
              msg.channel.sendMessage(`Es ist ein Fehler beim neu Laden von \`${params[i]}\` aufgetreten.`);
            }
          });
      }
    }
    return 'end-of-function';
  }

  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['relaod'],
      permLevel: 12,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'reload',
      shortdescription: 'Neu laden',
      description: 'Lädt den angegebenen oder alle Befehl neu.',
      usage: '$conf.prefixreload\n$conf.prefixreload [Command]\n$conf.prefixreload all',
    };
  }
};
