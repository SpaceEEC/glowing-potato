module.exports = class Next {
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
      } else if (!msg.guild.member(this.bot.user).voiceChannel) {
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts.')
          .then((mes) => mes.delete(5000));
      } else if (!this.bot.internal.music.channel(this.bot, msg) || !params[0] || isNaN(params[0])) {
        msg.channel.send(this.bot.commands.get('np').run(this.bot, msg, []))
          .then((mes) => mes.delete(5000));
      } else {
        const musik = this.bot.internal.musik.get(msg.guild.id);
        if (!musik._music.queue[parseInt(params[0])] || parseInt(params[0] < 1)) {
          msg.channel.send('Diese Position ist ungültig.')
            .then((mes) => mes.delete(5000));
        } else {
          musik._music.queue.splice(1, 0, musik._music.queue.splice(parseInt(params[0]), 1)[0]);
          msg.channel.send(this.bot.commands.get('np').run(this.bot, msg, ['1']));
        }
      }
    } else if (!this.bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      msg.channel.send(this.bot.commands.get('np').run(this.bot, msg, params));
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['drag'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'next',
      shortdescription: '',
      description: 'Pausiert den aktuellen Song.',
      usage: '$conf.prefixpause',
    };
  }
};
