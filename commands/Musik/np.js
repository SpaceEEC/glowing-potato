module.exports = class NP {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!this.bot.internal.musik.get(msg.guild.id)) {
      msg.channel.send('Zur Zeit wird leider nichts gespielt.')
        .then(mes => mes.delete(30000));
    } else {
      const musik = this.bot.internal.musik.get(msg.guild.id);
      if (!musik._music.queue[0]) {
        msg.channel.send('Die Queue ist leer.').then(mes => mes.delete(30000));
      } else {
        if (isNaN(params[0]) || !musik._music.queue[0]) params[0] = 0;
        msg.channel.sendEmbed(new this.bot.methods.Embed().setColor(0x0800ff).setThumbnail(musik._music.queue[params[0]].info.iurl)
          .setTitle(params[0] ? `**An Position: \`${params[0]}\`**` : musik._music.playing ? '**Wird gerade gespielt:**' : '**Momentan pausiert:**')
          .setDescription(`[${musik._music.queue[params[0]].info.title}](${musik._music.queue[params[0]].info.loaderUrl})\n`
          + `Hinzugefügt von: ${musik._music.queue[params[0]].requester}\n`
          + `Stand: \`(${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}/${musik._formatSecs(musik._music.queue[params[0]].info.length_seconds)})\`\n`))
          .then(mes => mes.delete(30000));
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
      name: 'np',
      shortdescription: '',
      description: 'Zeigt den aktuell gespielten Song an.',
      usage: '$conf.prefixnp',
    };
  }
};
