exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0]) {
    return msg.channel.sendMessage('Bitte gib einen Channel oder Nutzer an!');
  }
  if (params[0] === 'channels') {
    return bot.internal.config.get(bot, msg, 'ignchannels').then(v => msg.channel.sendMessage(v));
  } else if (params[0] === 'users') {
    return bot.internal.config.get(bot, msg, 'ignusers').then(v => msg.channel.sendMessage(v));
  }
  let type;
  let value;
  if (msg.mentions.users.size !== 0) {
    type = 'user';
    value = msg.mentions.users.first();
  } else if (msg.mentions.channels.size !== 0) {
    type = 'channel';
    value = msg.mentions.channels.first();
  } else if (bot.users.has(params[0])) {
    type = 'user';
    value = bot.users.get(params[0]);
  } else if (bot.channels.has(params[0])) {
    type = 'channel';
    value = bot.channels.get(params[0]);
  } else {
    return msg.channel.sendMessage('Die angegebene ID ist ungültig.');
  }
  if (type === 'user') {
    if (value.bot) {
      return msg.channel
      .sendMessage('Bots können nicht auf die Ignorelist gesetzt werden, da sie ohnehin ignoriert werden.');
    } else if (value.id === msg.guild.owner.id) {
      return msg.channel.sendMessage('Den Owner der Gilde ist nicht auf die Ignorelist zu setzen.');
    } else if (value.id === msg.author.id) {
      return msg.channel.sendMessage('Dich selber kannst du nicht auf die Ignorelist setzen.');
    } else if (value.id === bot.config.ownerID) {
      return msg.channel.sendMessage('Diese Person kann nicht auf die Ignorelist gesetzt werden.');
    }
    if (msg.conf.ignusers && msg.conf.ignusers.includes(value.id)) {
      // removing from list
      return bot.internal.config.remove(bot, msg, 'ignusers', value.id)
        .then(() => {
          msg.channel
          .sendMessage(`Der Nutzer ${bot.users.get(value.id)} wurde für diese Gilde von der Ignorlist gestrichen`);
        })
        .catch((e) => {
          msg.channel.sendMessage(e);
        });
    } else {
      // adding to list
      return bot.internal.config.add(bot, msg, 'ignusers', value.id)
        .then(() => {
          msg.channel
          .sendMessage(`Der Nutzer ${bot.users.get(value.id)} wurde für diese Gilde auf die Ignorlist gesetzt`);
        })
        .catch((e) => {
          msg.channel.sendMessage(e);
        });
    }
  } else if (type === 'channel') {
    if (msg.conf.ignchannels && msg.conf.ignchannels.includes(value.id)) {
      // removing from list
      return bot.internal.config.remove(bot, msg, 'ignchannels', value.id)
        .then(() => {
          msg.channel.sendMessage(`Der Channel ${bot.channels.get(value.id)} wird jetzt nicht mehr ignoriert.`);
        })
        .catch((e) => {
          msg.channel.sendMessage(e);
        });
    } else {
      // adding to list
      return bot.internal.config.add(bot, msg, 'ignchannels', value.id)
        .then(() => {
          msg.channel.sendMessage(`Der Channel ${bot.channels.get(value.id)} wird jetzt ignoriert.`);
        })
        .catch((e) => {
          msg.channel.sendMessage(e);
        });
    }
  }
});

exports.conf = {
  group: 'Admincommands',
  spamProtection: false,
  enabled: true,
  aliases: ['ign'],
  permLevel: 10,
};

exports.help = {
  name: 'ignore',
  shortdescription: 'Ignorelist',
  description: 'Dieser Befehl ermöglicht das Ignorieren von Nutzern und Channeln, sowie das Unignorieren dieser.',
  usage: '$conf.prefixignore <@mention|#channel|ID>\n$conf.prefixignore <users|channels>',
};
