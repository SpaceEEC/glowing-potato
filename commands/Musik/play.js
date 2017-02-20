const request = require('superagent');
const yt = require('ytdl-core');

module.exports = class Play {
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
      if (!params[0]) {
        msg.channel.sendMessage('Bitte gib mir einen Youtubelink oder ID mit, andernfalls kann ich leider nichts spielen.')
          .then((mes) => mes.delete(5000));
      } else if (!this.bot.internal.music.channel(this.bot, msg, true)) {
        msg.channel.sendMessage('Du bist nicht in einem Channel, dem ich beitreten und sprechen darf.')
          .then((mes) => mes.delete(5000));
      } else if (params[0].includes('watch?v=') || params[0].length === 11) {
        this.add(this.bot, await msg.channel.sendMessage('Rufe Video ab...'), params[0], msg);
      } else if (params[0].includes('playlist?list=') || params[0].length > 11) {
        this.bulkadd(msg, params[0].includes('playlist?list=') ? params[0].split('playlist?list=')[1] : params[0], params[1]);
      } else {
        msg.channel.send(`Dieser Befehl akzeptiert nur Youtube Links und IDs.\nKonnte diesen Input nicht zuordnen.\nFalls du nach einem Titel suchen willst, nutze \`${msg.conf.prefix}search [Suchgebriffe]\`.`);
      }
    }
  }


  static async add(bot, statusmsg, url, msg) {
    if (!bot.internal.musik.has(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg));
    }
    const musik = bot.internal.musik.get(msg.guild.id);
    yt.getInfo(url, (err, info) => {
      if (err) {
        if (url.indexOf('?v=') !== -1) url = url.substr(url.indexOf('?v=') + 3);
        bot.err(`${url} | ${err.message}`);
        return statusmsg.edit('Es ist ein Fehler, beim Abrufen des Videos von Youtube aufgetreten!\nIst es öffentlich abrufbar?');
      }
      bot.info(`[${msg.guild.id}] Song added: ${info.title} Length: ${musik._formatSecs(info.length_seconds)}.`);
      if (musik.add({ url: url, info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member })) {
        return statusmsg.delete();
      } else {
        return statusmsg.edit('', {
          embed: {
            color: 0xFFFF00,
            author: {
              name: msg.member.displayName,
              icon_url: msg.author.displayAvatarURL,
            },
            description: `**++** [${info.title}](${info.loaderUrl})\n`
            + `Dauer: ${musik._formatSecs(info.length_seconds)}\n`
            + `Hinzugefügt von: ${msg.member}`,
            type: 'image',
            image: { url: info.iurl },
            footer: { text: `wurde hinzugefügt.${musik._music.disp ? ` (Ungefähre Zeit bis dahin: ${musik._formatSecs(musik._music.queue.reduce((a, b) => a + parseInt(b.info.length_seconds), parseInt(`-${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}`)))})` : ''}`, icon_url: bot.user.avatarURL },
          }
        }).then((mes) => {
          mes.delete(30000);
        });
      }
    });
  }


  async bulkadd(msg, id, count) {
    if (!parseInt(count)) {
      count = 20;
    } else if (parseInt(count) < 0) {
      count = count + count + count;
    }
    const statusmsg = await msg.channel.sendMessage('Rufe die Playlist ab...');
    const ids = await new Promise(resolve => this.query(id, count, null, resolve));
    if (typeof ids === 'string') {
      statusmsg.edit(ids);
    } else {
      statusmsg.edit(`Verarbeite \`${ids.length}\` in der Playlist gefundene Songs, dies kann einen Moment dauern...`);
      let finalsongs = 0;
      while (ids.length !== 0) {
        const newAdd = [];
        const idsPart = ids.splice(0, 25);
        const finPart = idsPart.length;
        this.bot.debug(`[${msg.guild.id}] Awaiting validating of ${finPart} Songs.`);
        const awaited = await new Promise(resolve => this.getInfo(newAdd, msg, idsPart, finPart, resolve));
        finalsongs += awaited;
        if (ids.length) statusmsg.edit(`Verarbeite noch \`${ids.length}\` weitere Songs, dies kann einen Moment dauern...`);
        this.bot.debug(`[${msg.guild.id}] Awaited validating of ${awaited} Songs`);
      }
      if (finalsongs) {
        statusmsg.edit(`Erfolgreich \`${finalsongs}\` Songs hinzugefügt.`)
          .then((del) => del.delete(10000));
      } else {
        statusmsg.edit(`\`${finalsongs}\` Songs hinzugefügt.\nSicher, dass die Playlist korrekt ist?\n(Gelöschte Videos / nicht in Deutschland erreichbar)`)
          .then((del) => del.delete(10000));
      }
    }
  }


  async query(id, finalamount, token, resolve, arr = []) {
    let requestamount = finalamount > 50 ? 50 : finalamount;
    finalamount -= requestamount;
    try {
      const res = await request.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${requestamount}&playlistId=${id}&${token ? `pageToken=${token}` : ''}&fields=items/snippet/resourceId/videoId,nextPageToken,pageInfo/totalResults&key=${this.bot.internal.auth.googletoken}`)
        .send(null)
        .set('Accept', 'application/json');
      arr = arr.concat(JSON.parse(res.text).items.map(s => s.snippet.resourceId.videoId));
      this.bot.debug(['query', requestamount, finalamount, JSON.parse(res.text).nextPageToken]);
      if (!JSON.parse(res.text).nextPageToken || finalamount === 0) resolve(arr);
      else this.query(id, finalamount, JSON.parse(res.text).nextPageToken, resolve, arr);
    } catch (e) {
      if (e.status === 404) {
        resolve(`Diese Playlist wurde nicht gefunden:\n`
          + `https://www.youtube.com/playlist?list=${id}\n`
          + `Sicher, dass dieser Link korrekt ist?`);
      } else if (e) {
        resolve(`Es ist ein Fehler beim ab Abrufen der Playlist aufgetreten:\n`
          + `Responsecode: ${e.status}\n`
          + `Nachricht: ${e.message}`);
      }
    }
  }


  getInfo(bot, toAdd, msg, ids, fin, resolve) {
    for (const vid in ids) {
      yt.getInfo(ids[vid], (err, info) => {
        if (err) {
          this.bot.err(err.message);
          fin--;
          if (toAdd.length === fin) {
            this.validate(bot, toAdd, true, null, this.bot.internal.musik.get(msg.guild.id), resolve);
          }
        } else {
          this.bot.debug(info.title);
          this.validate(bot, toAdd, fin, { order: vid, url: ids[vid], info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member }, this.bot.internal.musik.get(msg.guild.id), resolve);
        }
      });
    }
  }


  validate(bot, toAdd, fin, pushobj, musik, resolve) {
    this.bot.debug('validate');
    if (pushobj) pushobj = toAdd.push(pushobj);
    if (fin === true || pushobj === fin) {
      const ordered = toAdd.sort((a, b) => a.order - b.order);
      if (ordered.length) {
        musik.add(ordered);
        resolve(ordered.length);
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
      name: 'play',
      shortdescription: '',
      description: 'Spielt Songs.\nDer Befehl Akzeptiert Videos und Playlists als Youtube IDs und Links.\nBei Playlists werden, falls nicht anders angegeben, maximal 20 Elemente aus dieser Abgerufen.',
      usage: '$conf.prefixplay [ID/Url] (Anzahl)',
    };
  }
};
