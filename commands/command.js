exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[1] || !['disable', 'enable'].includes(params[0])) {
    return msg.channel.sendMessage('Fehlender Parameter oder ungültige Operation');
  }
  let cmd;
  if (bot.commands.has(params[1])) {
    cmd = params[1];
  } else if (bot.aliases.has(params[1])) {
    cmd = bot.commands.get(bot.aliases.get(params[1])).help.name;
  }
  if (params[0] === 'disable') {
    return bot.internal.config.add(bot, msg, 'disabledcommands', cmd)
    .then(() => {
      msg.channel.sendMessage(`Der Befehl \`${cmd}\` wurde Erfolgreich deaktiviert.`);
    })
    .catch(e => msg.channel.sendMessage(e));
  }
  if (params[0] === 'enable') {
    return bot.internal.config.remove(bot, msg, 'disabledcommands', cmd)
    .then(() => {
      msg.channel.sendMessage(`Der Befehl \`${cmd}\` wurde Erfolgreich aktiviert.`);
    })
    .catch(e => msg.channel.sendMessage(e));
  }
});


exports.conf = {
  group: 'Adminstuff',
  spamProtection: false,
  enabled: true,
  aliases: ['cmd'],
  permLevel: 10,
};


exports.help = {
  name: 'command',
  shortdescription: 'Befehlsverwaltung',
  description: 'Ermöglicht dass gildenweite aktivieren oder deaktiveren von Befehlen.',
  usage: '$conf.prefixcommand <disable|enable> [Befehl]',
};
