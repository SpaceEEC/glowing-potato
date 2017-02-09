exports.run = async (bot, msg, params = []) => { // eslint-disable-line consistent-return
  if (!params[0] || (params[0] && !bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`))) {
    const mes = await msg.channel.sendMessage('Bitte gib den Namen des zu ändernen Tags an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen.');
    try {
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
      if (bot.internal.tags.has(`${msg.guild.id}|${collected.first().content}`)) {
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
  if (bot.internal.tags.get(`${msg.guild.id}|${params.join(' ')}`).author === msg.author.id
    && bot.commands.get('tag').conf.editLevel > msg.permlvl) {
    return msg.channel.sendMessage('Du hast keine Rechte diesen Tag zu bearbeiten, da er dir nicht gehört.');
  }
  if (!params[1] || (params[1] && !bot.commands.get('tag').blacklist(msg, params.slice(1).join(' ')))) {
    const mes = await msg.channel.sendMessage('Bitte gib nun einen neuen Inhalt für diesen Tag an.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
    try {
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
      if (collected.first().content === 'cancel') {
        mes.delete();
        return msg.channel.sendMessage('Breche Anfrage, wie gewünscht, ab.');
      } else if (!bot.commands.get('tag').blacklist(msg, collected.first().content)) {
        return msg.channel.sendMessage(`Diese Antwort enthält einen Link, welcher nicht hotlinkbar scheint, verlinke das Bild über einen hotlinkbaren Hoster.\n\nFalls dieses Bild hotlinkbar ist kontaktiere \`${bot.config.owner}\`.`);
      } else {
        params[1] = collected.first().content;
      }
    } catch (e) {
      mes.delete();
      return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
    }
  }
  bot.debug(params[0].toLowerCase());
  return bot.internal.tag.edit(bot, msg.guild.id, params[0].toLowerCase(), params.slice(1).join(' '))
    .then(() => {
      msg.channel.sendMessage('Tag erfolgreich editiert!');
    })
    .catch((e) => {
      bot.err(`[tag-edit tag.edit()] ${e}`);
      msg.channel.sendMessage('Es ist ein interner Fehler beim editieren dieses Tags aufgetreten.\nDer Tag wurde vielleicht editiert, bevor du ihn erneut zu editieren versuchst, prüfe ob der Tag editiert wurde.\n\nAndernfalls kontaktiere `spaceeec#0302`.');
    });
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'tag-edit',
  shortdescription: '',
  description: 'Editiert einen Tag.',
  usage: '$conf.prefixtag-edit [Name] [Response]\n\nWichtiger Hinweis:\nBei Tags mit Leerzeichen im Namen den Befehl ohne Argumente aufrufen!',
};
