exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  if (cmd.conf.enabled && !msg.conf.disabledcommands.includes(cmd.help.name)) {
    resolve();
  } else if (!cmd.conf.enabled) {
    reject('Dieser Befehl ist global deaktiviert.');
  } else if (msg.conf.disabledcmds.includes(cmd.help.name)) {
    reject('Dieser Befehl ist gildenweit deaktiviert.');
  } else {
    bot.log(`
Unerwarteter Ausgang bei disabled.js:
cmd.help.name: ${cmd.help.name ? cmd.help.name : msg.content}
cmd.conf.enabled: ${cmd.conf.enabled ? cmd.conf.enabled : 'falsy'}
msg.conf.disabledcmds.includes(cmd.help.name): ${msg.conf.disabledcmds.includes(cmd.help.name)
        ? msg.conf.disabledcmds.includes(cmd.help.name) : 'falsy'}`);
    reject('Konnte den Deaktivierungsgrund nicht ermitteln.\nNotiz:Diese Fehlermeldung solltest du nicht bekommen.');
  }
});


exports.conf = {
  spamProtection: false,
  enabled: true,
};
