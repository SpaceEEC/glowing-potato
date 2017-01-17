const yt = require('ytdl-core');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const request = require('superagent');

class Music {
  constructor(bot) {
    this._bot = bot;
    this._voiceChannel = null;
    this._queue = [];
    this._con = null;
    this._disp = null;
    this._msg = null;
    this._playing = false;
    this._startup = 0;
    this._timeout = null;
    this._volume = 0.2;
  }

  add(msg, erl) {
    try {
      yt.getInfo(erl, (err, info) => {
        if (err) console.log(err); // eslint-disable-line
        const newest = this._queue.push({ url: erl, info: info, requester: msg.member }) - 1;
        if (!(this._disp && (this._con && this._con.speaking))) {
          this._voiceChannel = msg.member.voiceChannel;
          this._play(msg);
        } else {
          msg.channel.sendEmbed({
            color: 0xFFFF00,
            author: {
              name: msg.member.displayName,
              icon_url: msg.author.displayAvatarURL,
              url: null
            },
            description: `**++** [${this._queue[newest].info.title}](${this._queue[newest].info.loaderUrl})\n`
            + `Dauer: ${this._formatsecs(this._queue[newest].info.length_seconds)}\n`
            + `Hinzugefügt von: ${this._queue[newest].requester}`,
            type: 'image',
            image: { url: info.iurl },
            footer: { text: 'wurde hinzugefügt.', icon_url: this._bot.user.avatarURL },
            timestamp: new Date()
          })
            .then((mes) => {
              mes.delete(30000);
            })
            .catch(e => console.error(e)); // eslint-disable-line
        }
      });
    } catch (err) {
      msg.channel.sendMessage(`Fehler beim hinzufügen des Videos: \`${err}\``);
    }
  }

  bulkadd(msg, id) {
    msg.channel.sendMessage('Rufe die Playlist ab...').then(mes => {
      request.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${id}&fields=items/snippet/resourceId/videoId&key=${this._bot.internal.auth.googletoken}`)
        .send(null)
        .set('Accept', 'application/json')
        .end((e, res) => {
          if (e && e.status === 404) {
            return mes.edit(`Diese Playlist wurde nicht gefunden:\n`
              + `https://www.youtube.com/playlist?list=${id}\n`
              + `Sicher, dass dieser Link korrekt ist?`);
          } else if (e) {
            return mes.edit(`Es ist ein Fehler beim ab Abrufen der Playlist aufgetreten:\n`
              + `Responsecode: ${e.status}\n`
              + `${JSON.parse(e.text).error.message}`);
          } else {
            const urls = JSON.parse(res.text).items.map(s => s.snippet.resourceId.videoId);
            this._bot.log(`bulkadd(msg_obj, ${urls.length})`);
            let fin = urls.length;
            const toAdd = [];
            for (const erl in urls) {
              yt.getInfo(urls[erl], (err, info) => {
                if (err) {
                  console.error(err); // eslint-disable-line
                  fin--;
                } else {
                  this._bot.log(`bulkadd() ${info.title}`);
                  this._bulkaddvalidate(toAdd, fin, { order: erl, url: urls[erl], info: info, requester: msg.member }, msg, mes);
                }
              });
            }
            return mes.edit(`Verarbeite \`${urls.length}\` in der Playlist gefundene Songs, dies kann einen Moment dauern...`);
          }
        });
    });
  }

  search(msg, params) {
    let count = 1;
    if (params[0].match(/^-\d+$/g)) {
      count = params[0].replace('-', '');
      if (parseInt(count) > 50 || parseInt(count) < 0) {
        return msg.channel.sendMessage('Es werden nur bis zu `50` Ergebnisse unterstützt.');
      }
      params = params.slice(1);
    }
    return msg.channel.sendMessage('Wird gesucht, dies kann einen moment dauern...')
      .then(temp => {
        request.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${count}&order=relevance&q=${params.join('+')}&fields=items(id/videoId,snippet(thumbnails(default/url,high/url,maxres/url,medium/url,standard/url),title))&type=video&key=${this._bot.internal.auth.googletoken}`)
          .send(null)
          .set('Accept', 'application/json')
          .end((e, res) => {
            if (e) {
              temp.delete();
              return msg.channel.send(`Es ist ein Fehler bei der Suchanfrage aufgetreten:\n`
                + `Responsecode: ${e.status}\n`
                + `${e.text}`);
            } else if (JSON.parse(res.text).items.length === 0) {
              temp.delete();
              return msg.channel.send(`Auf diese Suchanfrage wurde nichts gefunden.`);
            } else if (JSON.parse(res.text).items.length === 1) {
              this.add(msg, JSON.parse(res.text).items[0].id.videoId);
              return temp.edit('Erfolgreich gefunden, spiele jetzt...').then(tmp => tmp.delete(5000));
            } else {
              this._selectsearchitem(msg, JSON.parse(res.text).items, 0);
              return temp.delete();
            }
          });
      });
  }

  queue() {
    if (this._queue.length < 2) {
      return this.np();
    } else {
      const e = new this._bot.methods.Embed();
      e.setColor(0x0800ff)
        .setThumbnail(this._queue[0].info.iurl)
        .setTitle(`Songs in der Queue: ${this._queue.length} | Insgesamte Länge: ${this._formatsecs(this._queue.reduce((a, b) => a + parseInt(b.info.length_seconds), 0))}`)
        .setDescription(`${this._playing ? '**Spiele gerade:**' : '**Momentan pausiert:**'} `
        + `\`(${this._formatsecs(Math.floor(this._disp.time / 1000))}/${this._formatsecs(this._queue[0].info.length_seconds)})\` `
        + `Von: ${this._queue[0].requester}\n`
        + `[${this._queue[0].info.title}](${this._queue[0].info.loaderUrl})`);
      let fieldtext = '';
      const fields = [];
      for (const song in this._queue) {
        if (song === '0') continue;
        // this._bot.log(`${song} | ${this._queue[song].info.title}`);
        let songtext = `\`${song}.\` [${this._queue[song].info.title}](${this._queue[song].info.loaderUrl}) Länge: ${this._formatsecs(this._queue[song].info.length_seconds)} | Von: ${this._queue[song].requester.toString()}\n`;
        if ((songtext.length + fieldtext.length) > 1024) {
          fields.push(fieldtext);
          fieldtext = songtext;
        } else {
          fieldtext += songtext;
        }
      }
      if (fieldtext.length > 0) fields.push(fieldtext);
      for (const field in fields) {
        // this._bot.log(`${field} | ${fields[field].substring(0, 15)}`);
        if (field > 25) break;
        e.addField(field === '0' ? 'Warteschlange:' : '\u200b', fields[field]);
      }
      return { embed: e };
    }
  }

  np() {
    if (this._queue.length === 0) {
      return `Die Queue ist leer, füge doch ein paar Songs hinzu!`;
    } else {
      return {
        embed: {
          color: 0x0800ff,
          thumbnail: { url: this._queue[0].info.iurl },
          title: this._playing ? '**Wird gerade gespielt:**' : '**Momentan pausiert:**',
          description: `[${this._queue[0].info.title}](${this._queue[0].info.loaderUrl})\n`
          + `Hinzugefügt von: ${this._queue[0].requester}\n`
          + `Stand: \`(${this._formatsecs(Math.floor(this._disp.time / 1000))}/${this._formatsecs(this._queue[0].info.length_seconds)})\`\n`
        }
      };
    }
  }

  skip() {
    if (!this._queue[0] || !this._disp) {
      return 'Nichts zu skippen.';
    } else {
      const msg = `-- **${this._queue[0].info.title}**`;
      this._disp.end();
      return msg;
    }
  }

  pauseresume(state) {
    // true = starten false = pausieren
    if (!(!!this._disp && !!this._con && this._queue.length !== 0)) {
      return 'Die Queue ist doch leer.\nWas willst du dann mit diesem Befehl?';
    }
    if (this._disp.paused !== state) {
      return 'Das geschieht doch bereits, oder etwa nicht?';
    } else if (state) {
      this._playing = true;
      this._disp.resume();
      this._bot.user.setGame(this._queue[0].info.title);
      return 'Fortgesetzt!';
    } else {
      this._playing = false;
      this._disp.pause();
      return 'Pausiert!';
    }
  }

  stop() {
    if (this._queue.length === 0) return 'Hier gibt es nichts zu stoppen oder löschen.';
    const response = `Leere die Queue (**${this._queue.length}** Songs) und beende die Wiedergabe.`;
    this._queue = this._queue.slice(this._queue.length - 1);
    if (this._disp) this._disp.end('stop');
    if (this._msg) {
      this._msg.delete().catch();
      this._msg = null;
    }
    this._bot.user.setGame(this._bot.config.game);
    this._con.channel.leave();
    return response;
  }

  volume(volume) {
    if (!this._queue[0] || !this._disp) {
      this._volume = volume;
      return 'Da zur Zeit nichts gespielt wird, wird ab dem nächsten Song die Läutstärke angepasst.';
    } else if (volume === 'get') {
      return `Die Lautstärke ist auf \`${this._volume * 100}%\` von maximal \`200%\` eingestellt.`;
    } else {
      this._volume = volume;
      this._disp.setVolume(volume);
      return 'Lautsärke angepasst.';
    }
  }

  _play(msg) {
    this._bot.log('playfunction erreicht');
    this._voiceChannel.join().then(con => {
      this._con = con;
      this._bot.log(`Länge der Queue: ${this._queue.length}`);
      if (this._msg) {
        this._msg.delete().catch();
        this._msg = null;
      }
      if (this._queue.length === 0) {
        this._bot.log('Queue ist leer.');
        msg.channel.sendMessage('Da die Queue leer ist, werde ich in 30 Sekunden diesen Channel verlassen falls bis dahin nichts hinzugefügt wurde.').then(mes => {
          this._msg = mes;
          this._timeout = this._bot.setTimeout(this._leaveChannel.bind(this), 30000);
        });
      } else {
        if (this._timeout) {
          this._bot.clearTimeout(this._timeout);
          this._timeout = null;
        }
        this._bot.log('Spiele nächsten Song');
        msg.channel.sendEmbed(
          {
            color: 0x00ff08,
            author: {
              name: this._queue[0].requester.displayName,
              icon_url: this._queue[0].requester.user.displayAvatarURL,
              url: null
            },
            description: `**>>** [${this._queue[0].info.title}](${this._queue[0].info.loaderUrl})\n`
            + `Dauer: ${this._formatsecs(this._queue[0].info.length_seconds)}\n`
            + `Hinzugefügt von: ${this._queue[0].requester}`,
            type: 'image',
            image: { url: this._queue[0].info.iurl },
            footer: { text: 'wird gerade gespielt.', icon_url: this._bot.user.avatarURL },
            timestamp: new Date()
          }
        )
          .then(mes => {
            this._msg = mes;
            if ([0, 2].includes(this._startup)) {
              if (this._startup === 0) this._startup = 1;
              this._disp = this._con.playStream(yt(this._queue[0].url, { audioonly: true }), { volume: this._volume, passes: 2 });
              this._bot.log(`Spiele jetzt: ${this._queue[0].info.title}`);
              this._bot.user.setGame(this._queue[0].info.title);
              this._playing = true;
              this._disp.on('error', (err) => {
                if (this._startup === 1) this._startup = 2;
                this._bot.err('this._disp.on(\'error\')');
                console.error(err); // eslint-disable-line
                this._queue.shift();
                this._play(this._msg);
              });
              this._disp.on('end', (reason) => {
                if (this._startup === 1) this._startup = 2;
                this._playing = false;
                this._bot.log(`Song beendet nach: ${this._formatsecs(Math.floor(this._disp.time / 1000))}`);
                this._queue.shift();
                if (reason !== 'stop') this._play(this._msg);
              });
            } else {
              this._bot.log('Nachricht, während des startes abgefangen.');
            }
          });
      }
    });
  }

  _bulkaddvalidate(toAdd, fullindex, pushobj, msg, mes) {
    this._bot.log(`_confirm(${fullindex})`);
    if (pushobj) pushobj = toAdd.push(pushobj);
    if (fullindex === true || pushobj === fullindex) {
      const ordered = toAdd.sort((a, b) => a.order - b.order);
      for (const song in ordered) {
        this._bot.log(`Queue length: ${this._queue.push({ url: ordered[song].url, info: ordered[song].info, requester: ordered[song].requester })}`);
      }
      if (!(this._disp && (this._con && this._con.speaking))) {
        mes.edit(`Erfolgreich \`${ordered.length}\` Songs hinzugefügt.`)
          .then((del) => del.delete(5000));
        this._voiceChannel = msg.member.voiceChannel;
        this._play(msg);
      }
    }
  }

  _selectsearchitem(msg, search, index, original) {
    if (!search[index]) {
      if (original) {
        original.delete().catch();
        msg.delete().catch();
      }
      return;
    }
    let thumbnail = search[index].snippet.thumbnails;
    thumbnail = thumbnail.maxres ? thumbnail.maxres.url
      : thumbnail.standard ? thumbnail.standard.url
        : thumbnail.high ? thumbnail.high.url
          : thumbnail.medium ? thumbnail.medium.url
            : thumbnail.default ? thumbnail.default.url
              : undefined;
    const embed = new this._bot.methods.Embed()
      .setColor(0x9370DB)
      .setTitle(search[index].snippet.title)
      .setImage(thumbnail)
      .setDescription('`y` zum bestätigen\n`n` für das nächste Ergebnis\n\nDiese Anfrage wird entweder in `30` Sekunden, oder bei der Eingabe von `cancel` abgebrochen.')
      .setFooter(`Suchergebnis ${index + 1} von insgesamt ${search.length} Ergebnissen.`, this._bot.user.avatarURL);
    let func;
    if (original) func = original.edit('', { embed: embed });
    else func = msg.channel.sendEmbed(embed);
    func.then(mes => {
      mes.channel.awaitMessages(item => item.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] }
      )
        .then(collected => {
          let input = collected.first().content;
          if (input !== 'y' && input !== 'n') {
            msg.delete().catch();
            mes.delete();
            collected.first().delete().catch();
          } else if (input === 'n') {
            collected.first().delete().catch();
            this._selectsearchitem(msg, search, index + 1, mes);
          } else {
            collected.first().delete().catch();
            mes.delete();
            this.add(msg, search[index].id.videoId);
          }
        })
        .catch(() => {
          msg.delete().catch();
          mes.delete();
        });
    });
  }

  _leaveChannel() {
    this._msg.delete();
    this._timeout = null;
    this._bot.log(`Verlasse Channel: ${this._con.channel.name}`);
    this._con.channel.leave();
    this._disp = null;
    this._bot.user.setGame(this._bot.config.game);
  }

  _formatsecs(secs) {
    return moment()
      .startOf('day')
      .seconds(secs)
      .format(secs > 3599 ? 'hh:mm:ss' : 'mm:ss');
  }
}

exports.init = async (bot) => {
  bot.log('Lade Musikklasse.');
  bot.internal.musik = Music;
  bot.musik = new Music(bot);
};