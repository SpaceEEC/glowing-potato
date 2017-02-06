exports.run = async (bot, msg, params = []) => { // eslint-disable-line consistent-return
  if (!params[0] || (params[0] && !bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`))) {
    const mes = await msg.channel.sendMessage('Entweder hast du keinen Tag angegeben, oder dieser Tag existiert nicht.\nVersuche es noch ein weiteres mal.\n\nDiese Anfrage wird bei Eingabe von `cancel`, einer fehlerhaften Eingabe, oder nach 30 Sekunden abgebrochen.');
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
  if (!(
    bot.internal.tags.get(`${msg.guild.id}|${params.join(' ')}`).author === msg.author.id
    && bot.commands.get('tag').conf.editLevel > msg.permlvl)) {
    return bot.internal.tag.remove(bot, msg.guild.id, params.join(' ').toLowerCase())
      .then(() => msg.channel.sendMessage('Dieser Tag wurde erfolgreich gelöscht.'))
      .catch((e) => {
        bot.err(`[tag-del tag.remove()] ${e}`);
        msg.channel.sendMessage(`Es ist ein interner Fehler beim Löschen dieses Tags aufgetreten.\nEs kann sein, dass der Tag nur temporär gelöscht worden ist.\n\nFalls der Tag nach einen Neustart wieder erscheint kontaktiere bitte \`${bot.config.owner}\``);
      });
  } else {
    return msg.channel.sendMessage('Du hast keine Rechte diesen Tag zu löschen, da er dir nicht gehört.');
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'tag-del',
  shortdescription: '',
  description: 'Entfernt einen Tag.',
  usage: '$conf.prefixtag-del [Name]',
};
