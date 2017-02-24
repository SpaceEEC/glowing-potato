const notpackage = require('../../package.json');

module.exports = class Info {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    let user;
    if (msg.cmd === 'info') user = this.bot.user;
    else user = msg.mentions.users.size ? msg.mentions.users.first() : this.bot.users.get(params[0]) || msg.author;
    console.log(user.id);
    const member = await msg.guild.fetchMember(user);
    if (!member) return msg.channel.sendMessage('Dieser Nutzer befindet sich in der Datenbank, ist aber nicht in dieser Gilde zu finden.');
    if (user.id === this.bot.user.id) {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xffa500).setTitle('Infos über den Bot.')
        .setDescription('\u200b')
        .addField('❯ Online seit:', `• ${this.bot.methods.moment.duration(this.bot.uptime).format(' D [Tage], H [Stunden], m [Min.], s [Sek.]')}`, true)
        .addField('❯ Speicherbelegung:', `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
        .addField('❯ Befehle geladen:', `• ${this.bot.commands.size}`, true)
        .addField('❯ spacebot-Version:', `• v${notpackage.version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`, true)
        .addField('❯ Shitcode repositorie:', '• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
        .addField('\u200b', '\u200b')
        .setTimestamp()
        .setThumbnail(this.bot.user.avatarURL)
        .setFooter(msg.content, msg.author.displayAvatarURL));
    } else {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xffa500).setAuthor('Stats', user.displayAvatarURL, user.displayAvatarURL)
        .setDescription(member.toString())
        .addField('❯ Clientseitig', `• Avatar: ${user.avatarURL ? `[Link](${user.avatarURL})` : 'Kein Avatar'}
• Account erstellt am:
${this.bot.methods.moment(user.createdAt).format('DD.MM.YYYY')}
• Status: \`${user.presence.status}\`
• Spiel: \n\`${user.presence.game ? user.presence.game.name : 'Kein Spiel'}\``, true)
        .addField('❯ Serverseitig:', `${
        member.nickname ? `• Nickname: \`${member.nickname}\`` : ''}
• Beigetreten am:
${this.bot.methods.moment(member.joinedAt).format('DD.MM.YYYY')}
${msg.author === user ? `• Permissionlevel:\n\`${msg.permlvl}\`` : ''}`, true)
        .setThumbnail(user.displayAvatarURL)
        .setTimestamp()
        .setFooter(msg.content, msg.author.avatarURL));
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['stats'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'info',
      description: 'Gibt Informationen über den angegebenen (oder deinem) Clienten an.',
      shortdescription: 'oder auch stats.',
      usage: '$conf.prefixstats (@mention)',
    };
  }
};
