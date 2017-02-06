exports.run = (bot, msg, params = []) => {
  if (!params[0]) {
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xffee00)
      .addField('Fehlender Parameter',
      'Bitte ein Emoji und mindestens eine Nachrichten ID angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  }
  if (!params[1]) {
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xffee00)
      .addField('Fehlender Parameter',
      'Bitte mindestens eine Nachrichten ID angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  }
  const msgs = params.slice(1);
  const emoji = msg.guild.emojis
    .exists('identifier', params[0].slice(2).slice(0, params[0].indexOf('>') - 2)) ? msg.guild.emojis
      .find('identifier', params[0].slice(2).slice(0, params[0].indexOf('>') - 2)) : params[0];

  msgs.forEach((id) => {
    msg.channel.fetchMessage(id).then(reactmsg => {
      reactmsg.react(emoji).catch(() => msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xffee00)
        .addField('Fehler',
        `Ist das Emoji ${emoji} korrekt?`)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL))
      );
    }).catch(() => msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xffee00)
      .addField('Fehler', `Ist die ID ${id} korrekt?`)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      msg.author.avatarURL))
      );
  });
  return msg.delete();
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 5,
};


exports.help = {
  name: 'react',
  description: 'Lässt den Bot mit dem angegebenen Emoji auf die angegebenen Nachrichten reagieren.',
  shortdescription: 'Reactions',
  usage: '$conf.prefixreact [emoji] [id] (id) ...',
};
