exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
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

  msgs.map((id) => { // eslint-disable-line
    msg.channel.fetchMessage(id).then(msg => { // eslint-disable-line
      msg.react(emoji).catch(err => msg.channel.sendEmbed(new bot.methods.Embed() // eslint-disable-line
        .setColor(0xffee00)
        .addField('Fehler',
        `Ist das Emoji ${emoji} korrekt?`)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL))
      );
    }).catch(err => msg.channel.sendEmbed(new bot.methods.Embed() // eslint-disable-line
      .setColor(0xffee00)
      .addField('Fehler', `Ist die ID ${id} korrekt?`)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      msg.author.avatarURL))
      );
  });
  msg.delete();
});


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
