module.exports = class Pause {
  constructor(bot) {
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
          msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
            .then((mes) => mes.delete(5000));
        } else if (!this.bot.internal.music.channel(this.bot, msg)) {
          msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
            .then((mes) => mes.delete(5000));
        } else {
          msg.channel.send(musik.toggleState(false) ? 'Fortgesetzt.' : 'Pausiert.')
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
      name: 'pause',
      shortdescription: '',
      description: 'Pausiert den aktuellen Song.',
      usage: '$conf.prefixpause',
    };
  }
};
