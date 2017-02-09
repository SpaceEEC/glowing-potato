const yt = require('ytdl-core');
const fs = require('fs-extra-promise');

class Music {
  constructor(bot, msg) {
    this._bot = bot;
    this._guild = msg.guild.id;
    this._tChannel = msg.conf.musicchannel
      && bot.channels.has(msg.conf.musicchannel)
      ? bot.channels.get(msg.conf.musicchannel)
      : msg.channel;
    this._vChannel = msg.member.voiceChannel;
    this._music = {
      loop: false,
      startup: false,
      statusmsg: null,
      queue: [],
      con: null,
      disp: null,
      playing: false,
      volume: 0.2,
    };
    this._leave = {
      timeout: null,
      empty: null,
      msg: null,
    };
  }

  add(input) {
    if (!input.length) input = [input];
    this._music.queue = this._music.queue.concat(input);
    if (this._music.queue.length === input.length) this._play();
    return this._music.queue.length === input.length;
  }

  loop(status) {
    if (status === true || status === false) {
      const r = this._music.loop !== status;
      this._music.loop = status;
      return r;
    }
    return this._music.loop;
  }

  toggleState(state) {
    if (!this._music.disp) return false;
    this._playing = state;
    if (state) {
      this._music.disp.resume();
      this._bot.user.setGame(this._music.queue[0].info.title);
    } else {
      this._music.disp.pause();
      this._bot.user.setGame(this._bot.config.game);
    }
    return state;
  }

  async _play() {
    this._bot.debug(`[${this._guild}] playfunction reached.`);
    this._music.con = await this._vChannel.join();
    this._bot.debug(`[${this._guild}] Length of the queue: ${this._music.queue.length}`);
    if (this._music.statusmsg) {
      this._music.statusmsg.delete().catch(() => { }); // eslint-disable-line no-empty-function
      this._music.statusmsg = null;
    }
    if (this._music.queue.length === 0) {
      // Empty queue
      this._bot.debug(`[${this._guild}] Queue is empty.`);
      this._leave.msg = await this._tChannel.sendMessage('Da die Queue leer ist, werde ich in 30 Sekunden diesen Channel verlassen falls bis dahin nichts hinzugefügt wurde.');
      // Setting 30 sec Timeout
      this._leave.timeout = this._bot.setTimeout(this._leaveChannel.bind(this), 30000);
    } else {
      // No empty queue
      if (this._leave.timeout) {
        // Deleting Timeout
        this._bot.clearTimeout(this._leave.timeout);
        this._leave.timeout = null;
      }
      this._bot.debug(`[${this._guild}] Playing next song...`);
      this._music.statusmsg = await this._tChannel.sendEmbed(new this._bot.methods.Embed()
        .setColor(0x00ff08).setAuthor(this._music.queue[0].requester.displayName, this._music.queue[0].requester.user.displayAvatarURL)
        .setDescription(`**>>** [${this._music.queue[0].info.title}](${this._music.queue[0].info.loaderUrl})\n`
        + `Dauer: ${this._formatSecs(this._music.queue[0].info.length_seconds)}\n`
        + `Hinzugefügt von: ${this._music.queue[0].requester}`
        + `${this._loop && this._music.queue.length === 1 ? '\n**Loop aktiv!**' : ''}`)
        .setImage(this._music.queue[0].info.iurl)
        .setFooter('wird gerade gespielt.', this._bot.user.avatarURL)
        .setTimestamp());
      if (!this._music.startup) {
        this._music.startup = true;
        this._bot.debug(`[${this._guild}] [stream] [ytdl-core] start`);
        const stream = yt(this._music.queue[0].url, { filter: 'audioonly' })
          .on('error', err => {
            this._music.startup = false;
            this._bot.err(`[${this._guild}] [stream] [ytdl-core-error]: ${this._bot.inspect(err)}`);
            this._tChannel.sendMessage(`Es ist ein Fehler beim Herunterladen von Youtube aufgetreten.\n\nKontaktiere, falls nötig, bitte \`${this._bot.config.owner}\`.`);
            this._music.queue.shift();
            this._play();
          });
        if (this._music.queue[0].info.length_seconds < 3599) {
          stream.once('end', () => {
            this._bot.debug(`[${this._guild}] [stream] [ytdl-core] end`);
            this._stream(`./var/tempmusicfile_${this._guild}`);
          });
          stream.pipe(fs.createWriteStream(`./var/tempmusicfile_${this._guild}`));
        } else {
          this._stream(stream);
        }
      } else {
        this._bot.warn(`[${this._guild}] Second message catched.`);
      }
    }
  }

  _stream(stream) {
    if (typeof stream === 'string') this._music.disp = this._music.con.playFile(stream, { volume: this._music.volume, passes: 2 });
    else this._music.disp = this._music.con.playStream(stream, { volume: this._music.volume, passes: 2 });
    this._bot.debug(`[${this._guild}] Now playing: ${this._music.queue[0].info.title}`);
    this._bot.user.setGame(this._music.queue[0].info.title);
    this._music.playing = true;
    this._music.disp.once('error', (err) => {
      if (this._startup === 1) this._startup = 0;
      this._bot.err(`[${this._guild}] [disp] [error] ${err.stack ? err.stack : err.message ? err.message : err}`);
      this._tChannel.sendMessage(`Es ist ein Fehler beim Abspielen aufgetreten.\n\nKontaktiere, falls nötig, bitte \`${this._bot.config.owner}\`.`);
    });
    this._music.disp.on('debug', (message) => {
      this._bot.debug(`[${this._guild}] [debug] [disp] ${message}`);
    });
    this._music.disp.once('end', (reason) => {
      fs.unlinkAsync(`./var/tempmusicfile_${this._guild}`)
        .catch(e => this._bot.err(`[${this._guild}] ${e}`));
      this._music.startup = false;
      this._music.playing = false;
      this._bot.info(`[${this._guild}] [disp] Song finished after: ${this._formatSecs(Math.floor(this._music.disp.time / 1000))} / ${this._formatSecs(this._music.queue[0].info.length_seconds)}`);
      if (!this._music.loop || !this._music.queue.length === 1 || reason === 'skip') this._music.queue.shift();
      if (reason !== 'stop') this._play();
    });
  }

  async _emptyChannel(empty) { // eslint-disable-line consistent-return
    if (empty) {
      if (this._leave.msg) {
        this._leave.msg.delete().catch(() => { }); // eslint-disable-line no-empty-function
      }
      if (this._leave.timeout) {
        this._bot.clearTimeout(this._leave.timeout);
        if (this._leave.empty) {
          return this._leaveChannel();
        }
      }
      this._leave.msg = await this._tChannel.sendMessage('Da der Channel leer ist, werde ich ihn in 30 Sekunden verlassen, falls bis dahin nicht irgendjemand zu mir stößt.');
      this._leave.empty = true;
      this.toggleState(false);
      this._leave.timeout = this._bot.setTimeout(this._emptyLeave.bind(this), 30000);
    } else {
      if (this._leave.empty) {
        if (this._leave.timeout) {
          this._bot.clearTimeout(this._leave.timeout);
          this._leave.timeout = null;
          this.toggleState(true);
        }
      }
      if (this._leave.msg) this._leave.msg.delete().catch(() => { }); // eslint-disable-line no-empty-function
    }
  }

  _emptyLeave() {
    this._bot.info(`[${this._guild}] Verlasse Channel, da leer.`);
    this._music.queue = this._music.queue.slice(this._music.queue.length - 1);
    if (this._music.disp) this._music.disp.end('stop');
    this._leaveChannel();
  }

  _leaveChannel() {
    this._bot.info(`[${this._guild}] Verlasse Channel.`);
    this._leave.timeout = null;
    if (this._music.statusmsg) this._music.statusmsg.delete().catch(() => { }); // eslint-disable-line no-empty-function
    if (this._leave.msg) this._leave.msg.delete().catch(() => { }); // eslint-disable-line no-empty-function
    this._music.con.disconnect();
    this._bot.user.setGame(this._bot.config.game);
    this._bot.internal.musik.delete(this._guild);
  }

  _formatSecs(secs) {
    return this._bot.methods.moment()
      .startOf('day')
      .seconds(secs)
      .format(secs > 3599 ? 'hh:mm:ss' : 'mm:ss');
  }
}

exports.perms = async (msg) => {
  if (msg.permlvl >= 5) return true;
  if (msg.conf.musicrole && msg.conf.musicchannel) return msg.member.roles.has(msg.conf.musicrole) && msg.channel.id === msg.conf.musicchannel;
  if (msg.member.roles.has(msg.conf.musicrole)) return true;
  if (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel) return true;
  return false;
};

exports.channel = (bot, msg, start = false) => {
  if (!msg.member.voiceChannel) return false;
  if (start) return start && msg.member.voiceChannel.joinable && msg.member.voiceChannel.speakable;
  if (!msg.guild.member(bot.user).voiceChannel) return false;
  if (!msg.guild.member(bot.user).voiceChannel.members.has(msg.author.id)) return false;
  return true;
};

exports.init = async (bot) => {
  bot.info('Lade Musikklasse.');
  bot.internal.musik = new bot.methods.Collection();
};

exports.Player = Music;
