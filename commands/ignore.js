exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0]) {
    return msg.channel.sendEmbed({
      description: 'Gib den zu Ignorierenden Nutzer/Channel per @Mention, #Channel oder per ID an.',
      color: msg.member.highestRole.color,
      fields: [{
        name: '\u200b',
        value: 'Um diese Anfrage abzubrechen gib `cancel` ein oder lass einfach 30 Sekunden verstreichen.',
      }],
    }).then(message => {
      msg.channel.awaitMessages(function filter(message, collector) { // eslint-disable-line
        if (message.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          let content = collected.first().content;
          message.delete();
          if (content === 'cancel') {
            bot.log('cancel');
            msg.delete();
            return collected.first().delete();
          } else {
            bot.log('else');
            collected.first().conf = msg.conf;
            return ignore(bot, collected.first(), collected.first().content.split(' '));
          }
        }).catch((error) => {
          if (!error.size) {
            bot.log('catch');
            msg.delete();
            message.delete();
            bot.err(error.stack);
          }
        });
    });
  }
  if (params[0] === 'channels') {
    return bot.internal.config.get(bot, msg, 'ignchannels').then(v => msg.channel.sendMessage(v));
  } else if (params[0] === 'users') {
    return bot.internal.config.get(bot, msg, 'ignusers').then(v => msg.channel.sendMessage(v));
  }
  ignore(bot, msg, params);
});


function ignore(bot, msg, params) {
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
            .sendMessage(
            `Der Nutzer ${bot.users.get(value.id)} wird jetzt nicht mehr in dieser Gilde von diesem Bot ignoriert.`);
        })
        .catch((e) => {
          msg.channel.sendMessage(e);
        });
    } else {
      // adding to list
      return bot.internal.config.add(bot, msg, 'ignusers', value.id)
        .then(() => {
          msg.channel
            .sendMessage(`Der Nutzer ${bot.users.get(value.id)} wird jetzt in dieser Gilde von diesem Bot ignoriert.`);
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
  } else {
    return bot.users.random();
  }
}


exports.conf = {
  group: 'Adminstuff',
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
