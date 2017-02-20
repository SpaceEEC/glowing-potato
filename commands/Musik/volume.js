module.exports = class Volume {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!this.bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = this.bot.internal.musik.get(msg.guild.id);
      if (this.bot.internal.music.perms(msg)) {
        if (!msg.guild.member(this.bot.user).voiceChannel) {
          msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
            .then((mes) => mes.delete(5000));
        } else if (!this.bot.internal.music.channel(this.bot, msg)) {
          msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
            .then((mes) => mes.delete(5000));
        } else if (params[0] % 1 === 0) {
          if (parseInt(params[0]) > 200 || parseInt(params[0]) < 0) {
            msg.channel.sendMessage('Bitte nur Zahlen von `0` bis `200` eingeben.');
          } else {
            msg.channel.send(musik.volume(Math.round(params[0] / 10) / 10));
          }
        } else {
          msg.channel.send(musik.volume('get'));
        }
      } else {
        msg.channel.send(musik.volume('get'));
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
      name: 'volume',
      shortdescription: '',
      description: 'Legt die Lautstärke fest, oder zeigt dies an. (Standardwert ist `20`)',
      usage: '$conf.prefixvolume (0-200)',
    };
  }
};
