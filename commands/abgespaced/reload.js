const fs = require('fs-extra-promise');

module.exports = class Reload {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0]) return msg.channel.send('Keinen Befehl zum neu Laden angegeben.');
    else return this.reload(msg, params);
  }


  async reload(msg, params = []) {
    if (params[0] === 'all') {
      const folders = await fs.readdirAsync('./commands/');
      this.bot.log(`Lade insgesamt ${folders.length} Befehlskategorien.`);
      for (const folder of folders) {
        const files = await fs.readdirAsync(`./commands/${folder}`);
        this.bot.log(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
        for (const f of files) {
          try {
            const props = require(`../commands/${folder}/${f}`);
            this.bot.commands.set(props.help.name, props);
            for (const alias of props.conf.aliases) { // eslint-disable-line max-depth
              this.bot.aliases.set(alias, props.help.name);
            }
          } catch (e) {
            this.bot.err(`Fehler beim Laden von ./commands/${folder}/${f}.js\n${e.stack ? e.stack : e}`);
          }
        }
      }
      return msg.channel.send('Laden abgeschlossen.');
    } else {
      const arr = [];
      for (const command of params) {
        try {
          const cmd = await this.bot.internal.commands.reload(this.bot, command);
          this.bot.log(`"./commands/${cmd.conf.group}/${command}.js" erfolgreich neu geladen.`);
          arr.push(`Neu laden von \`${command}\` erfolgreich abgeschlossen.`);
        } catch (err) {
          if (err.message.startsWith('Cannot find module ')) {
            this.bot.err(`Cannot find module: ${command}`);
            arr.push(`Konnte die Datei \`${command}.js\` nicht finden.\nVerwendest du einen Alias? 👀`);
          } else {
            this.bot.err(`Es ist ein Fehler beim neu Laden von ${command} aufgetreten:\n${err.stack ? err.stack : err}`);
            arr.push(`Es ist ein Fehler beim neu Laden von \`${command}\` aufgetreten.`);
          }
        }
      }
      return msg.channel.send(arr.join('\n\n'), { split: true });
    }
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
