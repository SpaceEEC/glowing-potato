const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndent } = require('common-tags');
const ytdl = require('ytdl-core');
const winston = require('winston');
const Youtube = require('simple-youtube-api');
const Song = require('../../structures/Song');
const auth = require('../../auth');

module.exports = class PlayMusicCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'play',
      aliases: ['search', 'serach'],
      group: 'music',
      memberName: 'play',
      description: 'Plays a song or playlist.',
      guildOnly: true,
      args: [
        {
          key: 'url',
          prompt: 'what would you like to add or search?\n',
          type: 'string',
        },
      ]
    });

    this.youtube = new Youtube(auth.googletoken);
    // hello crawl (or other curious people)
    this.queue = new Map();
    this.statusMessage = null;
  }

  hasPermission(msg) {
    const djRoles = msg.guild.settings.get('djRoles', []);
    if (!djRoles.length) return true;
    const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []), djRoles);
    return msg.member.roles.some(r => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    // I need a better way of parsing that.
    if (args.url.split(' ')[0].match(/^-\d+$/g)) {
      args.limit = parseInt(args.url.split(' ')[0].replace('-', ''));
      if (args.limit < 0) {
        args.limit = 1;
      }
      args.url = args.url.split(' ').slice(1).join(' ');
    }
    args.url = args.url.replace(/<(.+)>/g, '$1');
    const queue = this.queue.get(msg.guild.id);
    let voiceChannel;

    if (!queue) {
      voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel) {
        return msg.say('You are not in a voice channel, I won\'t whisper you the song or stuff.\nMove into a voice channel!');
      }
      if (!voiceChannel.joinable) {
        return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time.');
      }
      if (!voiceChannel.speakable) {
        return msg.say('Your party looks nice I\'d love to join, but I am unfortunately not allowed to speak there, so I don\'t even join.');
      }
    } else if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say('The party over here is good, you should join us!');
    }

    const fetchMessage = await msg.say('Fetching info...');

    return this.youtube.getVideo(args.url).then(video => {
      this.input(video, queue, msg, voiceChannel, fetchMessage);
    }).catch(() => {
      this.youtube.getPlaylist(args.url).then(playlist => {
        playlist.getVideos(args.limit || 20).then(videos => {
          this.input(videos, queue, msg, voiceChannel, fetchMessage);
        }).catch((err) => {
          winston.error('[YT-API]', err);
          fetchMessage.edit('❌ Error while fetching the songs of the playlist.');
        });
      }).catch(() => {
        if (!args.limit) args.limit = 5;
        if (args.limit > 50) args.limit = 50;
        this.youtube.searchVideos(args.url, args.limit).then(async videos => {
          const video = videos.length === 1 ? videos[0] : await this.chooseSong(msg, videos, 0, fetchMessage);
          if (video === null) return;
          this.input(video, queue, msg, voiceChannel, fetchMessage);
        }).catch(() => {
          fetchMessage.edit('❔ Nothing found.');
        });
      });
    });
  }

  async input(video, queue, msg, voiceChannel, fetchMessage) { // eslint-disable-line consistent-return
    if (!queue) {
      queue = {
        textChannel: msg.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 2,
        loop: false
      };

      await this.queue.set(msg.guild.id, queue);

      const [success, embed] = video instanceof Array ? await this.addPlaylist(msg, video) : await this.add(msg, video);
      if (!success) {
        this.queue.delete(msg.guild.id);
        return msg.say(embed);
      }

      try {
        queue.connection = await queue.voiceChannel.join();
        this.statusMessage = fetchMessage;
        await this.play(msg.guild.id, queue.songs[0]);
      } catch (err) {
        winston.error('[Join/play]', err);
        this.queue.delete(msg.guild.id);
        fetchMessage.edit(`❌ There was an error while joining your channel.`, { embed: null });
      }
    } else {
      const [success, embed] = video instanceof Array ? await this.addPlaylist(msg, video) : await this.add(msg, video);
      if (!success) {
        if (embed instanceof Array && embed.length > 5) embed.splice(5, embed.length - 5);
        return fetchMessage.edit(embed, { embed: null });
      }

      fetchMessage.edit('', { embed });
    }
  }

  async add(msg, video) {
    const queue = this.queue.get(msg.guild.id);

    if (video.durationSeconds === 0) {
      return [false, `❌ Live streams are not supported.`];
    }
    if (queue.songs.some(song => song.id === video.id)) {
      return [false, `⚠ That song is already in the queue.`];
    }

    const song = new Song(video, msg.member);
    queue.songs.push(song);
    return [true, new Embed()
      .setAuthor(song.member, song.avatar)
      .setTimestamp()
      .setImage(queue.songs[queue.songs.length - 1].thumbnail)
      .setColor(0xFFFF00)
      .setFooter('has been added.', this.client.user.displayAvatarURL)
      .setDescription(stripIndent`${queue.loop ? '**Loop is enabled**\n' : ''}**++** [${song.name}](${song.url})
        Length: ${song.lengthString}`)];
  }

  async addPlaylist(msg, videos) {
    const queue = this.queue.get(msg.guild.id);
    let ignored = 0;
    let lastsong = null;

    for (const video of videos) {
      if (video.durationSeconds === 0) {
        ignored++;
        continue;
      }
      if (queue.songs.some(song => song.id === video.id)) {
        ignored++;
        continue;
      }
      lastsong = new Song(video, msg.member);
      queue.songs.push(lastsong);
    }

    if (!lastsong) return [false, 'No song qualifys for adding. Maybe all of them are already queued?'];
    return [true, new Embed()
      .setAuthor(lastsong.member, lastsong.avatar)
      .setTimestamp()
      .setImage(queue.songs[queue.songs.length - 1].thumbnail)
      .setColor(0xFFFF00)
      .setFooter('has been added.', this.client.user.displayAvatarURL)
      .setDescription(stripIndent`${queue.loop ? '**Loop is enabled**\n' : ''}**++** \`${videos.length - ignored}\`/\`${videos.length}\` Songs

      Last Song of queue:
      [${lastsong.name}](${lastsong.url})
      Length: ${lastsong.lengthString}`)];
  }

  async chooseSong(msg, videos, index, statusmsg) {
    if (!videos[index]) {
      if (statusmsg) {
        statusmsg.delete();
        msg.delete();
      }
      return null;
    }

    const embed = new Embed()
      .setColor(0x9370DB)
      .setTitle(videos[index].title)
      .setImage(`https://img.youtube.com/vi/${videos[index].id}/mqdefault.jpg`)
      .setDescription('`y` to confirm\n`n` the next result\n\n Respond with `cancel` to cancel the command.\nThe command will automatically be cancelled in 30 seconds.')
      .setFooter(`Result ${index + 1} from ${videos.length} results.`, this.client.user.avatarURL);

    let func;
    if (statusmsg) func = statusmsg.edit({ embed });
    else func = msg.channel.sendEmbed(embed);
    const mes = await func;

    const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
    if (!collected) {
      msg.delete();
      mes.delete();
      return null;
    } else if (collected.content !== 'y' && collected.content !== 'n') {
      msg.delete();
      mes.delete();
      collected.delete();
      return null;
    } else if (collected.content === 'n') {
      collected.delete();
      return this.chooseSong(msg, videos, index + 1, mes);
    } else {
      collected.delete();
      return videos[index];
    }
  }

  async play(guildID, song, stopped = false) {
    if (this.statusMessage) this.statusMessage.delete().catch(() => null);
    const queue = this.queue.get(guildID);

    if (!song) {
      if (!stopped) this.statusMessage = await queue.textChannel.send('The queue is empty, I\'ll wait another 30 seconds for new songs before leaving.');
      queue.voiceChannel.leave();
      this.queue.delete(guildID);
      return;
    }

    this.statusMessage = await queue.textChannel.sendEmbed(
      new Embed().setColor(0x00ff08).setAuthor(song.username, song.avatar)
        .setDescription(stripIndent`${queue.loop ? '**Loop enabled**\n' : ''}**>>** [${song.name}](${song.url})
        Length: ${song.lengthString}`)
        .setImage(song.thumbnail)
        .setFooter('is now being played.', this.client.user.displayAvatarURL)
        .setTimestamp());

    let streamErrored = false;
    const stream = ytdl(song.url, { audioonly: true })
      .on('error', async err => {
        streamErrored = true;
        winston.error('[YTDL]', guildID, err);
        await this.statusMessage.edit(`An error occured while playing (ytdl).`);
        this.statusMessage = null;
        queue.songs.shift();
        this.play(guildID, queue.songs[0]);
      });

    const dispatcher = queue.connection.playStream(stream, { passes: 2 })
      .on('end', (reason) => {
        winston.info(`[Dispatcher] [${guildID}] ${reason ? `[${reason}]` : ''} Song finished after ${Song.timeString(Math.floor(dispatcher.time / 1000))} / ${song.length}`);
        if (streamErrored) return;
        const oldSong = queue.songs.shift();
        if (queue.loop) queue.songs.push(oldSong);
        this.play(guildID, queue.songs[0], reason === 'stop');
      })
      .on('error', async err => {
        winston.error(`[Dispatcher] [${guildID}]`, err);
        await this.statusMessage.edit(`An internal error occured while playing.`);
        this.statusMessage = null;
      });

    dispatcher.setVolumeLogarithmic(queue.volume / 5);
    song.dispatcher = dispatcher;
    song.playing = true;
  }
};
