module.exports = class Volume {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!this.bot.internal.musik.get(msg.guild.id)) {
      return msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = this.bot.internal.musik.get(msg.guild.id);
      if (this.bot.internal.music.perms(msg)) {
        if (!msg.guild.member(this.bot.user).voiceChannel) {
          return msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
            .then((mes) => mes.delete(5000));
        } else if (!this.bot.internal.music.channel(this.bot, msg)) {
          return msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
            .then((mes) => mes.delete(5000));
        } else if (params[0] % 1 === 0) {
          if (parseInt(params[0]) > 200 || parseInt(params[0]) < 0) {
            return msg.channel.sendMessage('Bitte nur Zahlen von `0` bis `200` eingeben.');
          } else {
            musik._music.volume = Math.round(parseInt(params[0]) / 10) / 10;
            return msg.channel.send(`Läutstärke angepasst auf \`${musik._music.volume * 100}\`%.`);
          }
        }
      }
      return msg.channel.send(`Aktuelle Läutstärke beträgt \`${musik._music.volume * 100}\`%.`);
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
