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
  if (alle === '') alle = 'Entweder gehören alle Tags zu dir, oder es gibt gar keine auf diesem Server.';
  if (users === '') users = 'Du hast keine Tags, erstell doch welche!';
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
