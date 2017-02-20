module.exports = class Summon {
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
        msg.channel.sendMessage('Zur Zeit spiele ich leider nichts, füge doch einfach etwas hinzu!')
          .then((mes) => mes.delete(5000));
      } else if (this.bot.internal.music.channel(this.bot, msg, true)) {
        const musik = this.bot.internal.musik.get(msg.guild.id);
        musik._music.con = await msg.member.voiceChannel.join();
        musik._vChannel = msg.member.voiceChannel;
        msg.channel.sendMessage('Deinem Channel erfolgreich beigetreten.')
          .then((mes) => mes.delete(5000));
      } else {
        msg.channel.sendMessage('Du bist nicht in einem Channel, dem ich beitreten und sprechen darf.')
          .then((mes) => mes.delete(5000));
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
      name: 'summon',
      shortdescription: '',
      description: 'Lässt den Bot in den aktuallen Channel wechseln.\nFunktioniert nur, falls der Bot bereits spielt.',
      usage: '$conf.prefixsummon',
    };
  }
};
