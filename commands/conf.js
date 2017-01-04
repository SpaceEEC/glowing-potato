exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0] || !['get', 'set', 'reset'].includes(params[0])) {
    return msg.channel.sendCode('js', require('util').inspect(msg.conf));
  }
  if (!params[1]) {
    return msg.channel.sendMessage('Bitte gib einen Schlüssel an, mit welchem diese Operation ausgeführt werden soll.');
  }
  if (params[0] === 'get') {
    return bot.internal.config.get(bot, msg, params[1]).then(v => msg.channel.sendMessage(v));
  }
  if (params[0] === 'reset') {
    if (['id'].includes(params[1])) {
      return msg.channel.sendMessage('Dieser Schlüssel kann nicht zurückgesetzt werden.');
    }
    if (params[1] === 'name') {
      return bot.internal.config.set(bot, msg, params[1], msg.guild.name).then(r => msg.channel.sendMessage(r));
    }
    return bot.internal.config.reset(bot, msg, params[1]).then(r => msg.channel.sendMessage(r));
  }
  if (params[0] === 'set') {
    if (['ignchannels', 'ignusers'].includes(params[1])) {
      return msg.channel.sendMessage('platzhalternachricht wegen ign array.');
    }
    if (params[1] === 'disabledcommands') {
      return msg.channel.sendMessage('platzhalternachricht wegen disabledCommands');
    }
    if (params[1] === 'id') {
      return msg.channel.sendMessage('Die `id` dieses Servers wird sich wohl kaum verändert haben.');
    }
    if (params[1] === 'name') {
      return bot.internal.config.set(bot, msg, params[1], msg.guild.name).then(r => msg.channel.sendMessage(r));
    }
    return bot.internal.config.set(bot, msg, params[1], params).then(r => msg.channel.sendMessage(r));
  }
});

exports.conf = {
  group: 'Admincommands',
  spamProtection: false,
  enabled: true,
  aliases: ['config'],
  permLevel: 10,
};

exports.help = {
  name: 'conf',
  shortdescription: 'Konfiguration',
  description: 'Mit diesem Befehl ist es möglich den Bot auf dieser Gilde zu konfigurieren.',
  usage: '$conf.prefixconf <list|get|set|reset> [Key] (Value)\n @Role, #Channel',
};
