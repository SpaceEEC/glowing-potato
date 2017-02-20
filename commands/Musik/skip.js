module.exports = class Skip {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line no-unused-vars
    if (this.bot.internal.music.perms(msg)) {
      if (!this.bot.internal.musik.get(msg.guild.id)) {
        msg.channel.send('Zur Zeit wird leider nichts gespielt.')
          .then(mes => mes.delete(30000));
      } else if (!msg.guild.member(this.bot.user).voiceChannel) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
          .then((mes) => mes.delete(5000));
      } else if (!this.bot.internal.music.channel(this.bot, msg)) {
        msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
          .then((mes) => mes.delete(5000));
      } else {
        const musik = this.bot.internal.musik.get(msg.guild.id);
        if (musik._music.queue.length === 0 || !musik._music.disp) {
          msg.channel.sendMessage('Die Queue ist leer, da gibt es nichts zu skippen.\nOder die Intialisierungsphase ist noch nicht vollendet, dies dauert einen kleinen moment.');
        } else {
          msg.channel.sendEmbed(new this.bot.methods.Embed().setColor(0xff0000).setThumbnail(musik._music.queue[0].info.iurl)
            .setAuthor(`${msg.member.displayName} hat geskippt:`, msg.author.displayAvatarURL)
            .setDescription(`[${musik._music.queue[0].info.title}](${musik._music.queue[0].info.loaderUrl})\n`
            + `Hinzugefügt von: ${musik._music.queue[0].requester}\n`
            + `Stand: \`(${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}/${musik._formatSecs(musik._music.queue[0].info.length_seconds)})\`\n`))
            .then(mes => mes.delete(30000));
          this.bot.info(`[${msg.guild.id}] Song skipped.`);
          musik._music.disp.end('skip');
        }
      }
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'skip',
      shortdescription: '',
      description: 'Skippt den aktuellen Song.',
      usage: '$conf.prefixskip\n',
    };
  }
};
