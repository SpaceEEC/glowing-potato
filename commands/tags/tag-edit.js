module.exports = class TagEdit {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line consistent-return
    if (!params[0] || (params[0] && !this.bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`))) {
      const mes = await msg.channel.sendMessage('Bitte gib den Namen des zu ändernen Tags an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen.');
      try {
        const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
        if (this.bot.internal.tags.has(`${msg.guild.id}|${collected.first().content}`)) {
          params[0] = collected.first().content;
        } else {
          mes.delete();
          return msg.channel.sendMessage('Dieser Tag wurde nicht gefunden.');
        }
      } catch (e) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      }
    }
    if (this.bot.internal.tags.get(`${msg.guild.id}|${params.join(' ')}`).author === msg.author.id
      && this.bot.commands.get('tag').conf.editLevel > msg.permlvl) {
      return msg.channel.sendMessage('Du hast keine Rechte diesen Tag zu bearbeiten, da er dir nicht gehört.');
    }
    if (!params[1] || (params[1] && !this.bot.commands.get('tag').blacklist(msg, params.slice(1).join(' ')))) {
      const mes = await msg.channel.sendMessage('Bitte gib nun einen neuen Inhalt für diesen Tag an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
      try {
        const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
        if (collected.first().content === 'cancel') {
          mes.delete();
          return msg.channel.sendMessage('Breche Anfrage, wie gewünscht, ab.');
        } else if (!this.bot.commands.get('tag').blacklist(msg, collected.first().content)) {
          return msg.channel.sendMessage(`Diese Antwort enthält einen Link, welcher nicht hotlinkbar scheint, verlinke das Bild über einen hotlinkbaren Hoster.\n\nFalls dieses Bild hotlinkbar ist kontaktiere \`${this.bot.config.owner}\`.`);
        } else {
          params[1] = collected.first().content;
        }
      } catch (e) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      }
    }
    this.bot.debug(params[0].toLowerCase());
    return this.bot.internal.tag.edit(this.bot, msg.guild.id, params[0].toLowerCase(), params.slice(1).join(' '))
      .then(() => {
        msg.channel.sendMessage('Tag erfolgreich editiert!');
      })
      .catch((e) => {
        this.bot.err(`[tag-edit tag.edit()] ${e}`);
        msg.channel.sendMessage('Es ist ein interner Fehler beim editieren dieses Tags aufgetreten.\nDer Tag wurde vielleicht editiert, bevor du ihn erneut zu editieren versuchst, prüfe ob der Tag editiert wurde.\n\nAndernfalls kontaktiere `spaceeec#0302`.');
      });
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'tag-edit',
      shortdescription: '',
      description: 'Editiert einen Tag.',
      usage: '$conf.prefixtag-edit [Name] [Response]\n\nWichtiger Hinweis:\nBei Tags mit Leerzeichen im Namen den Befehl ohne Argumente aufrufen!',
    };
  }
};
