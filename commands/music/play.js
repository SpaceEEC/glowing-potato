const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndent } = require('common-tags');
const ytdl = require('ytdl-core');
const winston = require('winston');
const Youtube = require('simple-youtube-api');
const Song = require('../../structures/Song');
const { googletoken } = require('../../auth');
const fs = require('fs');

module.exports = class PlayMusicCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'play',
			aliases: ['search', 'serach'],
			group: 'music',
			memberName: 'play',
			description: 'Plays a song or a playlist.',
			details: stripIndent`The input parameter accepts:
      A link to a Youtube video.
      A link to a Youtube playlist.
      A search text to search a video on youtube.
      For search or playlists you can provide a search cap by prepending 
      \`-n\`, where n is a number.
      Search is capped at 50, Playlists are capped at 200.`,
			examples: [
				'`play Yousei Teikoku Weißflügel` Picks the first result and plays or queues it.',
				'`play -3 Yousei Teikoku Weißlügel` Will let you pick one of the first the resulst. Is capped at 50.',
				'`play -50 PLvlw_ICcAI4ermdmmjtr6uxYj0eZ_nKc4` Will queue up the first 50 songs of that playlist. Default is 20, cap is at 200.',
				'Instead of ID or search text, you can simply use the youtube url.',
				'If you want to queue up a playlist be sure to add the actual playlist link, rather than a video link with an "attached" playlist.',
				'Look out for a `playlist?list=` in the url.'
			],
			guildOnly: true,
			args: [
				{
					key: 'input',
					prompt: 'what would you like to add or search?\n',
					type: 'string',
				},
			]
		});

		this.youtube = new Youtube(googletoken);
		// hello crawl (or other curious people)
		this.queue = new Map();
		this.statusMessage = null;
		this.playlistTimeout = null;
		this.emptyTimeout = null;
	}

	hasPermission(msg) {
		const djRoles = msg.guild.settings.get('djRoles', []);
		if (!djRoles.length) return true;
		const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []), djRoles);
		return msg.member.roles.some(r => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		// I need a better way of parsing that.
		if (args.input.split(' ')[0].match(/^-\d+$/g)) {
			args.limit = parseInt(args.input.split(' ')[0].replace('-', ''));
			if (args.limit < 0) {
				args.limit = 1;
			}
			args.input = args.input.split(' ').slice(1).join(' ');
		}
		args.input = args.input.replace(/<(.+)>/g, '$1');
		const queue = this.queue.get(msg.guild.id);
		let voiceChannel;

		if (!queue) {
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.say('You are not in a voice channel, I won\'t whisper you the song.\nMove into a voice channel!')
					.then((mes) => mes.delete(5000));
			}
			if (!voiceChannel.joinable) {
				return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time, buddy.')
					.then((mes) => mes.delete(5000));
			}
			if (!voiceChannel.speakable) {
				return msg.say('Your party sure looks nice, I\'d love to join, but I am unfortunately not allowed to speak there, so forget that.')
					.then((mes) => mes.delete(5000));
			}
		} else if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say('The party over here is good, you better join us!')
				.then((mes) => mes.delete(5000));
		}

		const fetchMessage = await msg.say('Fetching info...');

		return this.youtube.getVideo(args.input).then(video => {
			this.input(video, queue, msg, voiceChannel, fetchMessage);
		}).catch(() => {
			this.youtube.getPlaylist(args.input).then(playlist => {
				if (args.limit && args.limit > 200) args.limit = 200;
				playlist.getVideos(args.limit || 20).then(videos => {
					this.input(videos, queue, msg, voiceChannel, fetchMessage);
				}).catch((err) => {
					winston.error('[YT-API]', err);
					fetchMessage.edit('❌ Playlist was found, but an error occured while fetching the songs. Better try again or something different!');
				});
			}).catch(() => {
				if (!args.limit) args.limit = 1;
				if (args.limit > 50) args.limit = 50;
				this.youtube.searchVideos(args.input, args.limit).then(async videos => {
					const video = videos.length === 1 ? videos[0] : await this.chooseSong(msg, videos, 0, fetchMessage);
					if (video === null) return;
					this.input(video, queue, msg, voiceChannel, fetchMessage);
				}).catch(() => {
					fetchMessage.edit('❔ Nothing found. Search better!')
						.then(mes => mes.delete(5000));
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
				return msg.say(embed)
					.then((mes) => mes.delete(30000));
			}

			try {
				queue.connection = await queue.voiceChannel.join();
				await this.play(msg.guild.id, queue.songs[0]);
				fetchMessage.delete().catch(() => null);
			} catch (err) {
				winston.error('[Join/play]', err);
				this.queue.delete(msg.guild.id);
				fetchMessage.edit('❌ There was an error while joining your channel, such a shame!', { embed: null });
			}
		} else {
			const [success, embed] = video instanceof Array ? await this.addPlaylist(msg, video) : await this.add(msg, video);
			if (!success) {
				if (embed instanceof Array && embed.length > 5) embed.splice(5, embed.length - 5);
				return fetchMessage.edit(embed, { embed: null })
					.then((mes) => mes.delete(10000));
			}

			fetchMessage.edit('', { embed })
				.then((mes) => mes.delete(5000));
		}
	}

	async add(msg, video) {
		const queue = this.queue.get(msg.guild.id);

		if (video.durationSeconds === 0) {
			return [false, '❌ Live streams are not supported.'];
		}
		if (queue.songs.some(song => song.id === video.id)) {
			return [false, '⚠ That song is already in the queue.'];
		}
		if (video.durationSeconds > 60 * 60) {
			return [false, 'ℹ That song is too long, max length is one hour.'];
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
			if (video.durationSeconds > 60 * 60) {
				ignored++;
				continue;
			}

			lastsong = new Song(video, msg.member);
			queue.songs.push(lastsong);
		}

		if (!lastsong) return [false, 'No song qualifies for adding. Maybe all of them are already queued?'];
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
				statusmsg.delete().catch(() => null);
				msg.delete().catch(() => null);
			}
			return null;
		}

		const embed = new Embed()
			.setColor(0x9370DB)
			.setTitle(videos[index].title)
			.setImage(`https://img.youtube.com/vi/${videos[index].id}/mqdefault.jpg`)
			.setDescription('`y` to confirm\n`n` the next result\n\n Respond with `cancel` to cancel the command.\nThis prompt will automatically be cancelled in 30 seconds.')
			.setFooter(`Result ${index + 1} from ${videos.length} results.`, this.client.user.avatarURL);

		let func;
		if (statusmsg) func = statusmsg.edit({ embed });
		else func = msg.channel.sendEmbed(embed);
		const mes = await func;

		const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id && !msg.content.startsWith(msg.guild.commandPrefix), { maxMatches: 1, time: 30000 })).first();
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
		if (this.emptyTimeout) this.client.clearTimeout(this.emptyTimeout);
		const queue = this.queue.get(guildID);

		if (!song) {
			this.queue.delete(guildID);
			if (!stopped) {
				this.statusMessage = await queue.textChannel.send('The queue is empty, I\'ll wait another 30 seconds for new songs before leaving.');
				if (this.emptyTimeout) this.client.clearTimeout(this.emptyTimeout);
				this.emptyTimeout = this.client.setTimeout(() => {
					this.statusMessage.delete().catch(() => null);
					queue.voiceChannel.leave();
				}, 30000);
				return;
			}
			queue.voiceChannel.leave();
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
		const stream = ytdl(song.url, { filter: 'audioonly' })
			.on('error', async err => {
				streamErrored = true;
				winston.error('[YTDL]', guildID, err);
				await this.statusMessage.edit('❌ An error occured while playing the youtube stream.');
				this.statusMessage = null;
				queue.songs.shift();
				this.play(guildID, queue.songs[0]);
			})
			.once('end', () => {
				const dispatcher = queue.connection.playFile(`./tempmusicfile_${guildID}`, { passes: 2 })
					.on('end', (reason) => {
						dispatcher.stream.destroy();
						winston.info(`[Dispatcher][${guildID}] ${reason && reason !== 'Stream is not generating quickly enough.' ? `[${reason}]` : ''} Song finished after ${Song.timeString(Math.floor(dispatcher.time / 1000))} / ${song.lengthString}`);
						if (streamErrored) return;
						const oldSong = queue.songs.shift();
						if (queue.loop) queue.songs.push(oldSong);
						fs.unlink(`./tempmusicfile_${guildID}`, e => { if (e) winston.error(`[${guildID}] `, e); });
						this.play(guildID, queue.songs[0], reason === 'stop');
					})
					.on('error', async err => {
						winston.error(`[Dispatcher][${guildID}]`, err);
						await this.statusMessage.edit(`❌ An internal error occured while playing.`);
						this.statusMessage = null;
					});

				dispatcher.setVolumeLogarithmic(queue.volume / 5);
				song.dispatcher = dispatcher;
				song.playing = true;
			});
		stream.pipe(fs.createWriteStream(`./tempmusicfile_${guildID}`));
	}
};
