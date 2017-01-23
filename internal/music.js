const yt = require('ytdl-core');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const request = require('superagent');

class Music {
  constructor(bot, id) {
    this._bot = bot;
    this._guild = id;
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
        if (err) this._bot.log(err.message);
        const newest = this._queue.push({ url: erl, info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member }) - 1;
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
            footer: { text: `wurde hinzugefügt. (Ungefähre Zeit bis dahin: ${this._formatsecs(this._queue.reduce((a, b) => a + parseInt(b.info.length_seconds), parseInt(`-${this._formatsecs(Math.floor(this._disp.time / 1000))}`)))})`, icon_url: this._bot.user.avatarURL },
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

  bulkadd(msg, id, count) {
    if (!parseInt(count)) {
      count = 20;
    } else if (parseInt(count) < 0) {
      count = 1;
    } else if (parseInt(count) > 50) {
      count = 50;
    }
    msg.channel.sendMessage('Rufe die Playlist ab...').then(mes => {
      request.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${count}&playlistId=${id}&fields=items/snippet/resourceId/videoId&key=${this._bot.internal.auth.googletoken}`)
        .send(null)
        .set('Accept', 'application/json')
        .end((e, res) => {
          if (e && e.status === 404) {
            mes.edit(`Diese Playlist wurde nicht gefunden:\n`
              + `https://www.youtube.com/playlist?list=${id}\n`
              + `Sicher, dass dieser Link korrekt ist?`)
              .then(tmp => tmp.delete(5000));
          } else if (e) {
            mes.edit(`Es ist ein Fehler beim ab Abrufen der Playlist aufgetreten:\n`
              + `Responsecode: ${e.status}\n`
              + `Nachricht: ${e.message}`)
              .then(tmp => tmp.delete(10000));
          } else {
            const urls = JSON.parse(res.text).items.map(s => s.snippet.resourceId.videoId);
            this._bot.log(`[${this._guild}] bulkadd(msg_obj, ${urls.length})`);
            let fin = urls.length;
            const toAdd = [];
            for (const erl in urls) {
              mes.edit(`Verarbeite \`${urls.length}\` in der Playlist gefundene Songs, dies kann einen Moment dauern...`)
                .then((tmp) => {
                  yt.getInfo(urls[erl], (err, info) => {
                    if (err) {
                      this._bot.err(err.message);
                      fin--;
                      if (toAdd.length === fin) {
                        this._bulkaddvalidate(toAdd, true);
                      }
                    } else {
                      this._bot.log(`[${this._guild}] bulkadd() ${info.title}`);
                      this._bulkaddvalidate(toAdd, fin, { order: erl, url: urls[erl], info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member }, msg, tmp);
                    }
                  });
                });
            }
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
      this._bot.log(`[${this._guild}] Song skipped.`);
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
    this._bot.log(`[${this._guild}] Stopped playing through command.`);
    this._queue = this._queue.slice(this._queue.length - 1);
    if (this._disp) this._disp.end('stop');
    if (this._msg) {
      this._msg.delete();
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

  shuffle() {
    if (!this._queue[0] || !this._disp) {
      return 'Ich spiele zur Zeit nichts, also werde ich auch nichts mischen.';
    }
    if (this._queue.length < 3) {
      return 'Also, bei einer Queue von unter 3 Liedern, macht das durchmischen wohl nicht wirklich Sinn, oder? 👀';
    }
    const array = this._queue.slice(1);
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    array.splice(0, 0, this._queue[0]);
    this._queue = array;
    return 'Die Warteschlange wurde gemischt.';
  }

  _play(msg) {
    this._bot.log(`[${this._guild}] playfunction reached.`);
    this._voiceChannel.join().then(con => {
      this._con = con;
      this._bot.log(`[${this._guild}] Length of the queue: ${this._queue.length}`);
      if (this._msg !== null) {
        this._msg.delete()
          .catch((err) => { if (!err) this._bot.log('I think I made a mistake with the if.'); });
        this._msg = null;
      }
      if (this._queue.length === 0) {
        this._bot.log(`[${this._guild}] Queue is empty.`);
        msg.channel.sendMessage('Da die Queue leer ist, werde ich in 30 Sekunden diesen Channel verlassen falls bis dahin nichts hinzugefügt wurde.').then(mes => {
          this._msg = mes;
          this._timeout = this._bot.setTimeout(this._leaveChannel.bind(this), 30000);
        });
      } else {
        if (this._timeout) {
          this._bot.clearTimeout(this._timeout);
          this._timeout = null;
        }
        this._bot.log(`[${this._guild}] Playing next song...`);
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
              const stream = yt(this._queue[0].url, { audioonly: true })
                .on('error', err => {
                  this._bot.log(`[ytdl-core-error] [${this._guild}]: ${require('util').inspect(err)}`);
                });
              this._disp = this._con.playStream(stream, { volume: this._volume, passes: 2 });
              this._bot.log(`[${this._guild}] Now playing: ${this._queue[0].info.title}`);
              this._bot.user.setGame(this._queue[0].info.title);
              this._playing = true;
              this._disp.once('error', (err) => {
                if (this._startup === 1) this._startup = 0;
                this._bot.err(`[error]: [${this._guild}] ${err.message ? err.message : err}`);
              });
              this._disp.on('debug', (message) => {
                this._bot.log(`[debug] [${this._guild}] ${message}`);
              });
              this._disp.once('end', (reason) => {
                if (this._startup === 1) this._startup = 0;
                this._playing = false;
                this._bot.log(`[${this._guild}] Song finished after: ${this._formatsecs(Math.floor(this._disp.time / 1000))} / ${this._formatsecs(this._queue[0].info.length_seconds)}`);
                this._queue.shift();
                if (reason !== 'stop') this._play(this._msg);
              });
            } else {
              this._bot.log(`[${this._guild}] Second message catched.`);
            }
          });
      }
    })
      .catch((e) => {
        if (e.message.startsWith('You do not have permission to join this voice channel.')) {
          msg.channel.sendMessage('Ich darf deinem Channel nicht betreten.');
          this.stop();
        }
      });
  }

  _bulkaddvalidate(toAdd, fullindex, pushobj, msg, mes) {
    this._bot.log(`[${this._guild}] _confirm(${fullindex})`);
    if (pushobj) pushobj = toAdd.push(pushobj);
    if (fullindex === true || pushobj === fullindex) {
      const ordered = toAdd.sort((a, b) => a.order - b.order);
      for (const song in ordered) {
        this._bot.log(`[${this._guild}] Queue length: ${this._queue.push({ url: ordered[song].url, info: ordered[song].info, requester: ordered[song].requester })}`);
      }
      if (!(this._disp && (this._con && this._con.speaking))) {
        mes.edit(`Erfolgreich \`${ordered.length}\` Songs hinzugefügt.`)
          .then((del) => del.delete(10000));
        this._voiceChannel = msg.member.voiceChannel;
        this._play(msg);
      }
    }
  }

  _selectsearchitem(msg, search, index, original) {
    if (!search[index]) {
      if (original) {
        original.delete();
        msg.delete();
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
            msg.delete();
            mes.delete();
            collected.first().delete();
          } else if (input === 'n') {
            collected.first().delete();
            this._selectsearchitem(msg, search, index + 1, mes);
          } else {
            collected.first().delete();
            mes.delete();
            this.add(msg, search[index].id.videoId);
          }
        })
        .catch(() => {
          msg.delete();
          mes.delete();
        });
    });
  }

  _leaveChannel() {
    this._msg.delete()
      .catch((err) => { if (!err) this._bot.log('this won\'get logged'); });
    this._timeout = null;
    this._bot.log(`[${this._guild}] Leaving channel: ${this._con.channel.name}`);
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
exports.Player = Music;

exports.init = async (bot) => {
  bot.log('Lade Musikklasse.');
  bot.internal.musik = new bot.methods.Collection();
};
