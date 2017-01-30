exports.run = async (bot, oldMember, newMember) => {
  if (bot.internal.musik.has(newMember.guild.id) && newMember.guild.member(bot.user).voiceChannel) {
    if (newMember.guild.member(bot.user).voiceChannel.members.size === 1 && oldMember.voiceChannel.id === newMember.guild.member(bot.user).voiceChannel.id) {
      bot.internal.musik.get(newMember.guild.id)._emptyChannel(true);
    } else {
      bot.internal.musik.get(newMember.guild.id)._emptyChannel(false);
    }
  }
  if (newMember.user.bot) return;
  const conf = bot.confs.get(newMember.guild.id);
  if (!conf.vlogchannel) return;
  if (!bot.channels.get(conf.vlogchannel)
    .permissionsFor(newMember.guild.member(bot.user))
    .hasPermission('SEND_MESSAGES')) return;
  if (oldMember.voiceChannel !== newMember.voiceChannel) {
    let clr;
    let desc;
    // leave
    if (newMember.voiceChannel === undefined) {
      clr = 0xFF4500;
      desc = `[${bot.methods.moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} hat die Verbindung aus ${oldMember.voiceChannel.name} getrennt.`;
    } else if (oldMember.voiceChannel === undefined) {
      // join
      clr = 0x7CFC00;
      desc = `[${bot.methods.moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} hat sich in ${newMember.voiceChannel.name} eingeloggt.`;
    } else {
      // move
      clr = 3447003;
      desc = `[${bot.methods.moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} ging von ${oldMember.voiceChannel.name} zu ${newMember.voiceChannel.name}`;
    }
    bot.channels.get(conf.vlogchannel).sendEmbed({
      color: clr,
      author: {
        name: newMember.displayName,
        url: newMember.user.displayAvatarURL,
        icon_url: newMember.user.displayAvatarURL,
      },
      description: desc,
    });
  }
};
