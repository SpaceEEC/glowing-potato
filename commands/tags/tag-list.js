exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  let alle = '';
  let users = '';
  bot.internal.tags
    .filterArray((x, t) => t.startsWith(msg.guild.id))
    .sort()
    .forEach((tag) => {
      if (tag.author === msg.author.id) users += `\`${tag.name}\` `;
      else alle += `\`${tag.name}\` `;
    });
  if (!alle.lentgh) {
    if (users.length) {
      alle = 'Dir gehören alle Tags auf diesem Server, du könntest andere dazu anstiften auch mal Tags zu erstellen.';
    } else {
      alle = 'Es existieren Keine Tags auf diesem Server, erstell doch welche!';
    }
  }
  if (!users.length) users = 'Du hast keine Tags, erstell doch welche!';
  msg.channel.sendEmbed(new bot.methods.Embed()
    .setColor(0x3498db)
    .setTimestamp()
    .setThumbnail(bot.user.avatarURL)
    .setFooter(`${msg.author.username}: ${msg.content}`,
    bot.user.avatarURL)
    .addField('Verfügbare Tags:', alle)
    .addField(`Tags von ${msg.author.username}:`, users)
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