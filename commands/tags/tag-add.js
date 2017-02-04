exports.run = async (bot, msg, params = []) => { // eslint-disable-line consistent-return
  if (bot.commands.get('tag').conf.createLevel > msg.permlvl) return msg.channel.sendMessage('Du darfst leider keine Tags erstellen.');
  if (!params[0] || (params[0] && ['add', 'edit', 'remove', 'list'].includes(params[0])) || (params[0] && bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`))) {
    const mes = await msg.channel.sendMessage('Entweder ist kein Tagname angegeben, oder dieser ist bereits belegt.\nVersuch es bitte erneut.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
    try {
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
      if (collected.first().content === 'cancel') {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage, wie gewünscht, ab.');
      } else if (['add', 'edit', 'remove', 'list'].includes(collected.first().content) || bot.internal.tags.has(`${msg.guild.id}|${collected.first().content}`)) {
        return msg.channel.sendMessage('Dieser Tagname ist ungütlig oder bereits belegt.');
      } else {
        params[0] = collected.first().content;
      }
    } catch (e) {
      mes.delete();
      return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
    }
  }
  if (!params[1] || (params[1] && !bot.commands.get('tag').blacklist(msg, params.slice(1).join(' ')))) {
    const mes = await msg.channel.sendMessage('Es wurde kein Inhalt für diesen Tag angegeben oder dieser enthält einen ungültigen Link.\nBitte gebe an, was auf diesen Tag gesendet werden soll.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen');
    try {
      const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
      if (collected.first().content === 'cancel') {
        mes.delete();
        return msg.channel.sendMessage('Breche Anfrage, wie gewünscht, ab.');
      } else if (!bot.commands.get('tag').blacklist(msg, collected.first().content)) {
        return msg.channel.sendMessage('Diese Antwort enthält einen Link, welcher nicht hotlinkbar scheint, verlinke das Bild über einen hotlinkbaren Hoster.\n\nFalls dieses Bild hotlinkbar ist kontaktiere `spaceeec#0302`.');
      } else {
        params[1] = collected.first().content;
      }
    } catch (e) {
      mes.delete();
      return msg.channel.sendMessage('Breche die Anfrage, wie durch die inaktivität gewünscht, ab.');
    }
  }
  bot.internal.tag.add(bot, msg.guild.id, params[0].toLowerCase(), params.slice(1).join(' '), msg.author.id)
    .then(() => {
      msg.channel.sendMessage('Tag erfolgreich erstellt!');
    })
    .catch((e) => {
      bot.err(`[tag-add tag.add()] ${e}`);
      msg.channel.sendMessage('Es ist ein interner Fehler beim Erstellen dieses Tags aufgetreten.\nDer Tag wurde vielleicht erstellt, bevor du es erneut zu erstellen versuchst, prüfe zunächst ob der Tag erstellt wurde.');
    });
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'tag-add',
  shortdescription: '',
  description: 'Fügt einen Tag hinzu.',
  usage: '$conf.prefixtag-add [Name] [Response]\nTags mit Leerzeichen im Namen sind auch möglich, dazu einfach den Befehl ohne Argumente aufrufen.',
};
