module.exports = class Resume {
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
      } else {
        const musik = this.bot.internal.musik.get(msg.guild.id);
        if (!msg.guild.member(this.bot.user).voiceChannel) {
          msg.channel.sendMessage('Zur Zeit ist leider nichts pausiert.')
            .then((mes) => mes.delete(5000));
        } else if (!this.bot.internal.music.channel(this.bot, msg)) {
          msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
            .then((mes) => mes.delete(5000));
        } else {
          msg.channel.send(musik.toggleState(true) ? 'Läuft jetzt.' : 'Jetzt pausiert.')
            .then((mes) => mes.delete(5000));
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
      name: 'resume',
      shortdescription: '',
      description: 'Setzt den Song wieder fort.',
      usage: '$conf.prefixresume',
    };
  }
};
