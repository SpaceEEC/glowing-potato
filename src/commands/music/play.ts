import { stripIndents } from 'common-tags';
import { GuildMember, Message, RichEmbed, Role, StreamDispatcher, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { ArgumentInfo, Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { createWriteStream, unlink } from 'fs';
import * as moment from 'moment';
import { Stream } from 'stream';
import * as winston from 'winston';

import Song from '../../structures/Song';
import Util from '../../util/util';

const { get }: { get: any } = require('snekfetch');
const ytdl: any = require('ytdl-core');
const youtube: any = require('simple-youtube-api');
const { googletoken }: { googletoken: string } = require('../../../config');

const options: winston.ConsoleTransportOptions = {
	colorize: true,
	level: 'summon',
	prettyPrint: true,
	timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))
};

export const logger: winston.LoggerInstance = new (winston.Logger)({
	transports: [new winston.transports.Console(options)],
	levels: {
		dispatcher: 0,
		musicInfo: 0,
		summon: 0,
		youtubeapi: 0,
		ytdl: 0,
	}
});

winston.addColors({
	dispatcher: 'magenta',
	musicInfo: 'cyan',
	summon: 'red',
	youtubeapi: 'red',
	ytdl: 'red',
});

export type queue = {
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	connection: VoiceConnection;
	songs: song[];
	volume: number;
	loop: boolean;
};

type video = {
	id: string;
	title: string;
	durationSeconds: number;
};

export type song = {
	name: string;
	id: string;
	length: number;
	member: GuildMember;
	dispatcher: StreamDispatcher;
	playing: boolean;
	url: string;
	thumbnail: string;
	username: string;
	avatar: string;
	lengthString: string;
	timeLeft: Function;
};

type youtubeResponse = {
	items: youtubeVideo[];
	nextPageToken: string;
	pageInfo: {
		totalResults: string;
	};
};

type youtubeVideo = {
	snippet: {
		resourceId: {
			videoId: string;
		}
	}
};

export default class PlayMusicCommand extends Command {
	public queue: Map<string, queue>;
	public youtube: any;
	private statusMessage: Message;
	private playlistTimeout: NodeJS.Timer;
	private emptyTimeout: NodeJS.Timer;
	private util: Util;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'play',
			aliases: ['search', 'serach'],
			group: 'music',
			memberName: 'play',
			description: 'Plays a song or playlist.',
			details: stripIndents`The input parameter accepts:
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

		this.youtube = new youtube(googletoken);
		// hello crawl (or other curious people)
		this.queue = new Map();
		this.util = new Util(client);
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { input: string, limit: number }): Promise<Message | Message[]> {
		// i need a better way for parsing that.
		if (args.input.split(' ')[0].match(/^-\d+$/g)) {
			args.limit = parseInt(args.input.split(' ')[0].replace('-', ''));
			if (args.limit < 0) {
				args.limit = 1;
			}
			args.input = args.input.split(' ').slice(1).join(' ');
		}
		args.input = args.input.replace(/<(.+)>/g, '$1');
		const queue: queue = this.queue.get(msg.guild.id);
		let voiceChannel: VoiceChannel;

		if (!queue) {
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.say('You are not in a voice channel, I won\'t whisper you the song.\nMove into a voice channel!')
					.then((mes: Message) => mes.delete(5000));
			}
			if (!voiceChannel.joinable) {
				return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time, buddy.')
					.then((mes: Message) => mes.delete(5000));
			}
			if (!voiceChannel.speakable) {
				return msg.say('Your party sure looks nice, I\'d love to join, but I am unfortunately not allowed to speak there, so forget that.')
					.then((mes: Message) => mes.delete(5000));
			}
		} else if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say('The party over here is good, you better join us!')
				.then((mes: Message) => mes.delete(5000));
		}

		const fetchMessage: Message = await msg.say('Fetching info...') as Message;

		return this.youtube.getVideo(args.input).then((video: video) => {
			this.input(video, queue, msg, voiceChannel, fetchMessage);
		}).catch(() => {
			this.youtube.getPlaylist(args.input).then(async (playlist: { id: string }) => {
				if (!args.limit) args.limit = 20;
				else if (args.limit > 200) args.limit = 200;
				const ids: string[] | string = await this.query(playlist.id, args.limit, null);
				if (typeof ids === 'string') return fetchMessage.edit(ids);
				fetchMessage.edit(`Proccessing \`${ids.length}\` songs, this may take a while...`);
				const addedSongs: video[] = await new Promise<video[]>((resolve: (value: video[]) => void) => this.getInfo(ids, resolve));
				if (addedSongs.length) {
					return this.input(addedSongs, queue, msg, voiceChannel, fetchMessage);
				}
				return fetchMessage.edit(`Nothing added, sure that there are available videos in the playlist?`)
					.then((del: Message) => del.delete(10000));
			}).catch(() => {
				if (!args.limit) args.limit = 1;
				if (args.limit > 50) args.limit = 50;
				this.youtube.searchVideos(args.input, args.limit).then(async (videos: video[]) => {
					const video: video = videos.length === 1 ? videos[0] : await this.chooseSong(msg, videos, 0, fetchMessage);
					if (!video) return;
					this.input(video, queue, msg, voiceChannel, fetchMessage);
				}).catch(() => {
					fetchMessage.edit('❔ Nothing found. Search better!')
						.then((mes: Message) => mes.delete(5000));
				});
			});
		});
	}

	private async query(id: string, finalamount: number, pagetoken: string, arr: string[] = []): Promise<string[] | string> {
		const requestamount: number = finalamount > 50 ? 50 : finalamount;
		finalamount -= requestamount;
		try {
			const { body }: { body: youtubeResponse } = await get(
				`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${requestamount}&playlistId=${id}&${pagetoken ? `pageToken=${pagetoken}` : ''}&fields=items/snippet/resourceId/videoId,nextPageToken,pageInfo/totalResults&key=${googletoken}`)
				.send(null).set('Accept', 'application/json');
			arr = arr.concat(body.items.map((s: youtubeVideo) => s.snippet.resourceId.videoId));
			winston.silly('query', requestamount, finalamount, body.nextPageToken);
			if (!body.nextPageToken || !finalamount) return arr;
			else return this.query(id, finalamount, body.nextPageToken, arr);
		} catch (e) {
			if (e) logger.log('youtubeapi', 'query', e);
			return '❌ Playlist was found, but an error occured while fetching the songs. Better try again or something different!';
		}
	}

	private async getInfo(ids: string[], resolve: (value: video[]) => void): Promise<void> {
		const videos: video[] = [];
		let amount: number = ids.length;
		for (const vid in ids) {
			if (!ids[vid]) continue;
			this.youtube.getVideo(ids[vid]).then((video: video) => {
				winston.silly(video.title);
				videos.push(video);
				if (videos.length === amount) resolve(videos);
			}).catch(() => (videos.length === --amount) && resolve(videos));
		}
	}

	private async input(video: video | video[], queue: queue, msg: CommandMessage, voiceChannel: VoiceChannel, fetchMessage: Message): Promise<void> {
		if (!queue) {
			queue = {
				textChannel: msg.channel as TextChannel,
				voiceChannel,
				connection: null,
				songs: [],
				volume: this.client.provider.get(msg.guild, 'volume', 2),
				loop: false
			};

			await this.queue.set(msg.guild.id, queue);

			const [success, embed] = video instanceof Array ? await this.addPlaylist(msg, video) : await this.add(msg, video);
			if (!success) {
				this.queue.delete(msg.guild.id);
				msg.say(embed)
					.then((mes: Message) => mes.delete(30000));
				return;
			}

			try {
				queue.connection = await queue.voiceChannel.join();
				await this.play(msg.guild.id, queue.songs[0]);
				fetchMessage.delete().catch(() => null);
			} catch (err) {
				logger.log('summon', msg.guild.id, 'join', err);
				this.queue.delete(msg.guild.id);
				fetchMessage.edit('❌ There was an error while joining your channel, such a shame!', { embed: null });
			}
		} else {
			const [success, embed] = video instanceof Array ? this.addPlaylist(msg, video) : await this.add(msg, video);
			if (!success) {
				fetchMessage.edit(embed, { embed: null })
					.then((mes: Message) => mes.delete(10000));
				return;
			}

			fetchMessage.edit('', { embed })
				.then((mes: Message) => mes.delete(5000));
		}
	}

	private add(msg: CommandMessage, video: video): [boolean, RichEmbed | string] {
		const queue: queue = this.queue.get(msg.guild.id);

		if (video.durationSeconds === 0) {
			return [false, '❌ Live streams are not supported.'];
		}
		if (queue.songs.some((song: song) => song.id === video.id)) {
			return [false, '⚠ That song is already in the queue.'];
		}
		if (video.durationSeconds > 60 * 60) {
			return [false, 'ℹ That song is too long, max length is one hour.'];
		}

		const song: song = new Song(video, msg.member);
		queue.songs.push(song);
		return [true, new RichEmbed()
			.setAuthor(song.username, song.avatar)
			.setTimestamp()
			.setImage(queue.songs[queue.songs.length - 1].thumbnail)
			.setColor(0xFFFF00)
			.setFooter('has been added.', this.client.user.displayAvatarURL)
			.setDescription(stripIndents
				`${queue.loop ? '**Loop is enabled**\n' : ''}**++** [${song.name}](${song.url})
				Length: ${song.lengthString}`)];
	}

	private addPlaylist(msg: CommandMessage, videos: video[]): [boolean, RichEmbed | String] {
		const queue: queue = this.queue.get(msg.guild.id);
		let ignored: number = 0;
		let lastsong: song;

		for (const video of videos) {
			if (video.durationSeconds === 0) {
				ignored++;
				continue;
			}
			if (queue.songs.some((song: song) => song.id === video.id)) {
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

		if (!lastsong) return [false, 'No song qualifies for adding. Maybe all of them are already queued or too long.'];
		return [true, new RichEmbed()
			.setAuthor(lastsong.username, lastsong.avatar)
			.setTimestamp()
			.setImage(queue.songs[queue.songs.length - 1].thumbnail)
			.setColor(0xFFFF00)
			.setFooter('has been added.', this.client.user.displayAvatarURL)
			.setDescription(stripIndents
				`${queue.loop ? '**Loop is enabled**\n' : ''}**++** \`${videos.length - ignored}\`/\`${videos.length}\` Songs

      			Last Song of queue:
      			[${lastsong.name}](${lastsong.url})
      			Length: ${lastsong.lengthString}`)];
	}
	private async chooseSong(msg: CommandMessage, videos: video[], index: number, statusmsg: Message): Promise<null | video> {
		if (!videos[index]) {
			if (statusmsg) {
				statusmsg.delete().catch(() => null);
				msg.delete().catch(() => null);
			}
			return null;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x9370DB)
			.setTitle(videos[index].title)
			.setImage(`https://img.youtube.com/vi/${videos[index].id}/mqdefault.jpg`)
			.setFooter(`Result ${index + 1} from ${videos.length} results.`, this.client.user.avatarURL);

		if (statusmsg) statusmsg = await statusmsg.edit({ embed });
		else statusmsg = await msg.channel.sendEmbed(embed);

		const argument: ArgumentInfo = {
			key: 'choice',
			prompt: '`y` to confirm\n`n` for the next result.',
			type: 'string',
		};

		const choice: string = await this.util.prompt<string>(msg, argument, false);

		if (!choice) return null;

		if (choice[0] === 'y') return videos[index];
		else if (choice[0] === 'n') return this.chooseSong(msg, videos, index + 1, statusmsg);
		else return null;
	}

	private async play(guildID: string, song: song, stopped = false): Promise<void> {
		if (this.statusMessage) this.statusMessage.delete().catch(() => null);
		if (this.emptyTimeout) this.client.clearTimeout(this.emptyTimeout);
		const queue: queue = this.queue.get(guildID);

		if (!song) {
			this.queue.delete(guildID);
			if (!stopped) {
				this.statusMessage = await queue.textChannel.send('The queue is empty, I\'ll wait another 30 seconds for new songs before leaving.') as Message;
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
			new RichEmbed().setColor(0x00ff08).setAuthor(song.username, song.avatar)
				.setDescription(stripIndents
					`${queue.loop ? '**Loop enabled**\n' : ''}**>>** [${song.name}](${song.url})
        			Length: ${song.lengthString}`)
				.setImage(song.thumbnail)
				.setFooter('is now being played.', this.client.user.displayAvatarURL)
				.setTimestamp());

		let streamErrored: boolean = false;
		const startTime: Date = new Date();

		const stream: Stream = ytdl(song.url, { filter: 'audioonly' })

			.on('error', async (err: Error) => {
				streamErrored = true;
				logger.log('ytdl', guildID, err);
				await this.statusMessage.edit('❌ An error occured while playing the youtube stream.');
				this.statusMessage = null;
				queue.songs.shift();
				this.play(guildID, queue.songs[0]);
			})

			.once('end', () => {
				logger.log('musicInfo', guildID, 'Piping to file finished after', (Song.timeString(moment().diff(startTime, 'seconds'))));
				const dispatcher: StreamDispatcher = queue.connection.playFile(`./tempmusicfile_${guildID}`, { passes: 2 })

					.on('error', async (err: Error) => {
						logger.log('dispatcher', guildID, err);
						await this.statusMessage.edit(`❌ An internal error occured while playing.`);
						this.statusMessage = null;
					})

					.on('start', () => {
						logger.log('musicInfo', guildID, 'Dispatcher started.');
					})

					.on('end', (reason: string) => {
						(dispatcher.stream as any).destroy();
						logger.log('musicInfo', guildID, `Song finished after ${Song.timeString(Math.floor(dispatcher.time / 1000))} / ${song.lengthString} ${reason ? `Reason: ${reason}` : ''}`);
						if (streamErrored) return;
						const oldSong: song = queue.songs.shift();
						if (queue.loop) queue.songs.push(oldSong);
						unlink(`./tempmusicfile_${guildID}`, (e: Error) => e && winston.error(guildID, e));
						this.play(guildID, queue.songs[0], reason === 'stop');
					});

				dispatcher.setVolumeLogarithmic(queue.volume / 5);
				song.dispatcher = dispatcher;
				song.playing = true;
			});

		stream.pipe(createWriteStream(`./tempmusicfile_${guildID}`));
		logger.log('musicInfo', guildID, 'Piping to file started for: ', song.name);
	}
};
