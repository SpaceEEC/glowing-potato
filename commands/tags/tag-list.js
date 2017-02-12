exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  let alle = [];
  let users = [];
  bot.internal.tags
    .filterArray((x, t) => t.startsWith(msg.guild.id))
    .sort()
    .forEach((tag) => {
      if (tag.author === msg.author.id) users.push(`\`${tag.name}\``);
      else alle.push(`\`${tag.name}\``);
    });
  if (!alle[0]) {
    if (users[0]) {
      alle = ['Dir gehören alle Tags auf diesem Server, du könntest andere dazu anstiften auch mal Tags zu erstellen.'];
    } else {
      alle = ['Es existieren keine Tags auf diesem Server, erstell doch welche!'];
    }
  }
  if (!users[0]) users = ['Du hast keine Tags, erstell\' doch welche!'];
  msg.channel.sendEmbed(new bot.methods.Embed()
    .setColor(0x3498db)
    .setTimestamp()
    .setThumbnail(bot.user.avatarURL)
    .setFooter(`${msg.author.username}: ${msg.content}`,
    bot.user.avatarURL)
    .addField('Verfügbare Tags:', alle.join(' '))
    .addField(`Tags von ${msg.author.username}:`, users.join(' '))
  );
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['tags'],
  permLevel: 0,
};


exports.help = {
  name: 'tag-list',
  shortdescription: '',
  description: 'Listet alle Tags auf.',
  usage: '$conf.prefixtag-list\n',
};
