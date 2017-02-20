module.exports = class Loop {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (this.bot.internal.music.perms(msg)) {
      if (!this.bot.internal.musik.get(msg.guild.id)) {
        msg.channel.send('Zur Zeit wird leider nichts gespielt.')
          .then(mes => mes.delete(30000));
      } else {
        const musik = this.bot.internal.musik.get(msg.guild.id);
        if (!msg.guild.member(this.bot.user).voiceChannel) {
          msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
            .then((mes) => mes.delete(5000));
        } else if (!this.bot.internal.music.channel(this.bot, msg)) {
          msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
            .then((mes) => mes.delete(5000));
        } else if (!params[0]) {
          msg.channel.send(musik.loop() ? 'Loop ist aktiv.' : 'Loop ist nicht aktiv.')
            .then((mes) => mes.delete(5000));
        } else if (['an', 'true', 'y', 'on', '1'].includes(params[0].toLowerCase())) {
          msg.channel.send(musik.loop(true) ? 'Loop ist jetzt aktiviert.' : 'Loop ist bereits aktiv!')
            .then((mes) => mes.delete(5000));
        } else if (['aus', 'false', 'n', 'off', '0'].includes(params[0].toLowerCase())) {
          msg.channel.send(musik.loop(false) ? 'Loop ist jetzt nicht mehr aktiv.' : 'Loop ist bereits aus!')
            .then((mes) => mes.delete(5000));
        } else {
          msg.channel.send(musik.loop() ? 'Loop ist aktiv.' : 'Loop ist nicht aktiv.')
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
      name: 'loop',
      shortdescription: '',
      description: 'Wenn aktiv, wird der aktuelle Song dauerhaft wiederholt.',
      usage: '$conf.prefixloop (an/aus)',
    };
  }
};
