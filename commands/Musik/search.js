const request = require('superagent');

module.exports = class Search {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (this.bot.internal.music.perms(msg)) {
      if (!this.bot.internal.musik.has(msg.guild.id)) {
        this.bot.internal.musik.set(msg.guild.id, new this.bot.internal.music.Player(this.bot, msg));
      }
      if (!msg.member.voiceChannel) {
        msg.channel.sendMessage('Ich kann dich in keinem Voicechannel finden, bist du sicher, dass gerade dich in einem in dieser Gilde befindest?')
          .then((mes) => mes.delete(5000));
      } else if (!this.bot.internal.music.channel(this.bot, msg, true)) {
        msg.channel.sendMessage('Du bist nicht in einem Channel, dem ich beitreten und sprechen darf.')
          .then((mes) => mes.delete(5000));
      } else if (params[0]) {
        this.searchVideo(msg, params);
      } else {
        msg.channel.sendMessage('Ich könnte eine Suche gebrauchen. Ein einziges Wort würde reichen!')
          .then((mes) => mes.delete(5000));
      }
    }
  }


  async searchVideo(msg, params) {
    let count = 1;
    if (params[0].match(/^-\d+$/g)) {
      count = params[0].replace('-', '');
      if (parseInt(count) > 50 || parseInt(count) < 0) {
        count = 50;
      }
      params = params.slice(1);
    }
    const statusmsg = await msg.channel.sendMessage('Wird gesucht, dies kann einen moment dauern...');
    try {
      const res = await request.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${count}&order=relevance&q=${params.join('+')}&fields=items(id/videoId,snippet(thumbnails(default/url,high/url,maxres/url,medium/url,standard/url),title))&type=video&key=${this.bot.internal.auth.googletoken}`)
        .send(null)
        .set('Accept', 'application/json');
      if (JSON.parse(res.text).items.length === 0) {
        statusmsg.edit(`Auf diese Suchanfrage wurde nichts gefunden.`);
      } else if (JSON.parse(res.text).items.length === 1) {
        await statusmsg.edit('Erfolgreich gefunden!');
        this.bot.commands.get('play').add(this.bot, statusmsg, JSON.parse(res.text).items[0].id.videoId, msg);
      } else {
        statusmsg.delete();
        this.selectItem(msg, JSON.parse(res.text).items, 0);
      }
    } catch (e) {
      statusmsg.edit(`Es ist ein Fehler bei der Suchanfrage aufgetreten:\n`
        + `Responsecode: ${e.status}\n`
        + `${e.text}`);
    }
  }


  async selectItem(msg, search, index, original) {
    // Löscht die Nachricht, falls das Ende erreicht ist. (NICHT LÖSCHEN)
    if (!search[index]) {
      if (original) {
        original.delete();
        msg.delete();
      }
      return;
    }
    let thumbnail;
    for (const option of ['maxres', 'standard', 'high', 'medium', 'default']) {
      if (search[index].snippet.thumbnails[option]) {
        thumbnail = search[index].snippet.thumbnails[option].url;
        break;
      }
    }
    const embed = new this.bot.methods.Embed()
      .setColor(0x9370DB)
      .setTitle(search[index].snippet.title)
      .setImage(thumbnail)
      .setDescription('`y` zum bestätigen\n`n` für das nächste Ergebnis\n\nDiese Anfrage wird entweder in `30` Sekunden, oder bei der Eingabe von `cancel` abgebrochen.')
      .setFooter(`Suchergebnis ${index + 1} von insgesamt ${search.length} Ergebnissen.`, this.bot.user.avatarURL);
    let func;
    if (original) func = original.edit({ embed });
    else func = msg.channel.sendEmbed(embed);
    const mes = await func;
    const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
    if (!collected) {
      msg.delete();
      mes.delete();
    } else if (collected.content !== 'y' && collected.content !== 'n') {
      msg.delete();
      mes.delete();
      collected.delete();
    } else if (collected.content === 'n') {
      collected.delete();
      this.selectItem(msg, search, index + 1, mes);
    } else {
      collected.delete();
      mes.delete();
      this.bot.commands.get('play').add(msg, search[index].id.videoId);
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['serach'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }

  static get help() {
    return {
      name: 'search',
      shortdescription: '',
      description: 'Ermöglicht die Suche nach Songs auf Youtube.',
      usage: '$conf.prefixsearch (-N) [Suchgebriffe]\n'
      + 'Beispiele:\n'
      + '`$conf.prefixsearch (-3) Cash Cash` - Lässt zwischen den ersten drei Ergebnissen auswählen.\n'
      + '`$conf.prefixsearch Cash Cash` - Nimmt einfach das erste Ergebnis und fügt es hinzu.\n',
    };
  }
};
