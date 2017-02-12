exports.run = async (bot, msg, params = []) => {
  if (!params[0]) {
    const message = await msg.channel.sendEmbed({
      description: 'Gib den zu Ignorierenden Nutzer/Channel per @Mention, #Channel oder per ID an.',
      color: msg.member.highestRole.color,
      fields: [{
        name: '\u200b',
        value: 'Um diese Anfrage abzubrechen gib `cancel` ein oder lass einfach 30 Sekunden verstreichen.',
      }],
    });
    const collected = (await msg.channel.awaitMessages(m => msg.author.id === m.author.id, { maxMatches: 1, time: 30000 })).first();
    message.delete();
    if (!collected) {
      msg.delete();
    } else if (collected.content === 'cancel') {
      msg.delete();
      collected.delete();
    } else {
      collected.conf = msg.conf;
      ignore(bot, collected, collected.content.split(' '));
    }
  } else if (params[0] === 'channels') {
    msg.channel.sendMessage(await bot.internal.config.get(bot, msg, 'ignchannels'));
  } else if (params[0] === 'users') {
    msg.channel.sendMessage(await bot.internal.config.get(bot, msg, 'ignusers'));
  } else {
    ignore(bot, msg, params);
  }
};


async function ignore(bot, msg, params) {
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
    msg.channel.sendMessage('Die angegebene ID ist ungültig.');
  }
  if (type === 'user') {
    if (value.bot) {
      msg.channel.sendMessage('Bots können nicht auf die Ignorelist gesetzt werden, da sie ohnehin ignoriert werden.');
    } else if (value.id === msg.guild.owner.id) {
      msg.channel.sendMessage('Den Owner der Gilde ist nicht auf die Ignorelist zu setzen.');
    } else if (value.id === msg.author.id) {
      msg.channel.sendMessage('Dich selber kannst du nicht auf die Ignorelist setzen.');
    } else if (value.id === bot.config.ownerID) {
      msg.channel.sendMessage('Diese Person kann nicht auf die Ignorelist gesetzt werden.');
    } else if (msg.conf.ignusers && msg.conf.ignusers.includes(value.id)) {
      await bot.internal.config.remove(bot, msg, 'ignusers', value.id);
      msg.channel.sendMessage(`Der Nutzer ${bot.users.get(value.id)} wird jetzt nicht mehr in dieser Gilde von diesem Bot ignoriert.`);
    } else {
      bot.internal.config.add(bot, msg, 'ignusers', value.id);
      msg.channel.sendMessage(`Der Nutzer ${bot.users.get(value.id)} wird jetzt in dieser Gilde von diesem Bot ignoriert.`);
    }
  } else if (type === 'channel') {
    if (msg.conf.ignchannels && msg.conf.ignchannels.includes(value.id)) {
      await bot.internal.config.remove(bot, msg, 'ignchannels', value.id);
      msg.channel.sendMessage(`Der Channel ${bot.channels.get(value.id)} wird jetzt nicht mehr ignoriert.`);
    } else {
      await bot.internal.config.add(bot, msg, 'ignchannels', value.id);
      msg.channel.sendMessage(`Der Channel ${bot.channels.get(value.id)} wird jetzt ignoriert.`);
    }
  }
}


exports.conf = {
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
