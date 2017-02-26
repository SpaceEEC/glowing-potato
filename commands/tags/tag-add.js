module.exports = class TagAdd {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (this.bot.commands.get('tag').conf.createLevel > msg.permlvl) return msg.channel.sendMessage('Du darfst leider keine Tags erstellen.');
    if (!params[0] || (params[0] && ['add', 'edit', 'remove', 'list'].includes(params[0])) || (params[0] && this.bot.internal.tags.has(`${msg.guild.id}|${params[0]}`))) {
      let mes;
      if (params[0] && this.bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
        mes = await msg.channel.sendMessage('Dieser Tagname ist bereits belegt!\nBitte gib einen Namen für diesen neuen Tag an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
      } else {
        mes = await msg.channel.sendMessage('Bitte gib einen Namen für diesen neuen Tag an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
      }
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 });
      if (!collected.size) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      } else if (collected.first().content === 'cancel') {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie gewünscht, ab.');
      } else if (['add', 'edit', 'remove', 'list'].includes(collected.first().content) || this.bot.internal.tags.has(`${msg.guild.id}|${collected.first().content}`)) {
        return msg.channel.sendMessage('Dieser Tagname ist ungütlig oder bereits belegt.');
      } else { params[0] = collected.first().content; }
    }
    if (!params[1] || (params[1] && !this.bot.commands.get('tag').blacklist(msg, params.slice(1).join(' ')))) {
      const mes = await msg.channel.sendMessage('Gib bitte nun den Inhalt für den neuen Tag an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1 });
      if (!collected.size) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
      } else if (collected.first().content === 'cancel') {
        mes.delete();
        return msg.channel.sendMessage('Breche Anfrage, wie gewünscht, ab.');
      } else if (!this.bot.commands.get('tag').blacklist(msg, collected.first().content)) {
        return msg.channel.sendMessage(`Diese Antwort enthält einen Link, welcher nicht hotlinkbar scheint, verlinke das Bild über einen hotlinkbaren Hoster.\n\nFalls dieses Bild hotlinkbar ist kontaktiere \`${this.bot.config.owner}\``);
      } else if (collected.first().attachments.first().height) {
        params[1] = `${collected.first().content}\n${collected.first().attachments.first().url}`;
      } else if (collected.first().content.length) {
        params[1] = collected.first().content;
      } else {
        return msg.channel.send('Nachricht enthält weder Text noch Bild.');
      }
    }
    return this.bot.internal.tag.add(this.bot, msg.guild.id, params[0].toLowerCase(), params.slice(1).join(' '), msg.author.id)
      .then(() => msg.channel.sendMessage('Tag erfolgreich erstellt!'))
      .catch((e) => {
        this.bot.err(`[tag-add] [tag.add()] ${e}`);
        msg.channel.sendMessage(`Es ist ein interner Fehler beim Erstellen dieses Tags aufgetreten.\nDer Tag wurde vielleicht erstellt, bevor du es erneut zu erstellen versuchst, prüfe zunächst ob der Tag erstellt wurde.\n\nAndernfalls kontaktiere \`${this.bot.config.owner}\``);
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
      name: 'tag-add',
      shortdescription: '',
      description: 'Fügt einen Tag hinzu.',
      usage: '$conf.prefixtag-add [Name] [Response]\nTags mit Leerzeichen im Namen sind auch möglich, dazu einfach den Befehl ohne Argumente aufrufen.',
    };
  }
};
