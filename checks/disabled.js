exports.run = (bot, msg, Command) => new Promise((resolve, reject) => {
  if (Command.conf.enabled && !msg.conf.disabledcommands.includes(Command.help.name)) {
    resolve();
  } else if (!Command.conf.enabled) {
    reject('Dieser Befehl ist global deaktiviert.');
  } else if (msg.conf.disabledcommands.includes(Command.help.name)) {
    reject('Dieser Befehl ist gildenweit deaktiviert.');
  } else {
    bot.warn(`
Unerwarteter Ausgang bei disabled.js:
Command.help.name: ${Command.help.name ? Command.help.name : msg.content}
Command.conf.enabled: ${Command.conf.enabled ? Command.conf.enabled : 'falsy'}
msg.conf.disabledcommands.includes(Command.help.name): ${msg.conf.disabledcommands.includes(Command.help.name)
        ? msg.conf.disabledcommands.includes(Command.help.name) : 'falsy'}`);
    reject('Konnte den Deaktivierungsgrund nicht ermitteln.\nHinweis:Diese Fehlermeldung solltest du nicht bekommen.');
  }
});


exports.conf = {
  spamProtection: false,
  enabled: true,
};
