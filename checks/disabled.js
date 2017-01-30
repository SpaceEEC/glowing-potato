exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  if (cmd.conf.enabled && !msg.conf.disabledcommands.includes(cmd.help.name)) {
    resolve();
  } else if (!cmd.conf.enabled) {
    reject('Dieser Befehl ist global deaktiviert.');
  } else if (msg.conf.disabledcommands.includes(cmd.help.name)) {
    reject('Dieser Befehl ist gildenweit deaktiviert.');
  } else {
    bot.warn(`
Unerwarteter Ausgang bei disabled.js:
cmd.help.name: ${cmd.help.name ? cmd.help.name : msg.content}
cmd.conf.enabled: ${cmd.conf.enabled ? cmd.conf.enabled : 'falsy'}
msg.conf.disabledcommands.includes(cmd.help.name): ${msg.conf.disabledcommands.includes(cmd.help.name)
        ? msg.conf.disabledcommands.includes(cmd.help.name) : 'falsy'}`);
    reject('Konnte den Deaktivierungsgrund nicht ermitteln.\nHinweis:Diese Fehlermeldung solltest du nicht bekommen.');
  }
});


exports.conf = {
  spamProtection: false,
  enabled: true,
};
