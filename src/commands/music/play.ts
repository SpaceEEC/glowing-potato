import { stripIndents } from 'common-tags';
import { Message, Permissions, RichEmbed, Role, StreamDispatcher, TextChannel, VoiceChannel } from 'discord.js';
import { ArgumentInfo, Command, CommandMessage, CommandoClient, GuildExtension } from 'discord.js-commando';
import { createWriteStream, unlink } from 'fs';
import * as moment from 'moment';
import { Stream } from 'stream';
import { addColors, ConsoleTransportOptions, error, Logger, LoggerInstance, silly, transports } from 'winston';
import { ytdl } from 'ytdl-core';

import Queue from '../../structures/Queue';
import Song from '../../structures/Song';
import Util from '../../util/util';
import { video, Youtube } from '../../util/youtube';

const yt: typeof ytdl = require('ytdl-core');

const options: ConsoleTransportOptions = {
	colorize: true,
	level: 'summon',
	prettyPrint: true,
	timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))
};

export const logger: LoggerInstance = new (Logger)({
	transports: [new transports.Console(options)],
	levels: {
		dispatcher: 0,
		musicInfo: 0,
		summon: 0,
		youtubeapi: 0,
		ytdl: 0,
	}
});

addColors({
	dispatcher: 'magenta',
	musicInfo: 'cyan',
	summon: 'red',
	youtubeapi: 'red',
	ytdl: 'red',
});

export default class PlayMusicCommand extends Command {
	public queue: Map<string, Queue>;
	private _util: Util;

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

		// hello crawl (or other curious people)
		this.queue = new Map<string, Queue>();
		this._util = new Util(client);
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
		const queue: Queue = this.queue.get(msg.guild.id);
		let voiceChannel: VoiceChannel;

		if (!queue) {
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) {
				return msg.say('You are not in a voice channel, I won\'t whisper you the song.\nMove into a voice channel!')
					.then((mes: Message) => mes.delete(5000));
			}

			const permissions: Permissions = voiceChannel.permissionsFor(this.client.user);
			if (!permissions.has('CONNECT')) {
				return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time, buddy.')
					.then((mes: Message) => mes.delete(5000));
			}
			if (!permissions.has('SPEAK')) {
				return msg.say('Your party sure looks nice, I\'d love to join, but I am unfortunately not allowed to speak there, so forget that.')
					.then((mes: Message) => mes.delete(5000));
			}
		} else if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say('The party over here is good, you better join us!')
				.then((mes: Message) => mes.delete(5000));
		}

		const fetchMessage: Message = await msg.say('Fetching info...') as Message;

		const video: video = await Youtube.getVideo(args.input);
		silly('video', video || false);

		if (video) return this._handleInput(video, queue, msg, voiceChannel, fetchMessage);

		const playlist: video[] = await Youtube.getPlaylist(args.input, Math.min(args.limit || 20, 200));
		silly('playlist', playlist && playlist[0] || false);

		if (playlist) return this._handleInput(playlist, queue, msg, voiceChannel, fetchMessage);

		const search: video[] = await Youtube.searchVideos(args.input, Math.min(args.limit || 1, 50));
		silly('search', search && search[0] || false);

		if (search) {
			const toAdd: video = search[1] ? await this._chooseSong(msg, search, fetchMessage) : search[0];

			if (!toAdd) return msg.say('Aborting then.')
				.then((mes: Message) => mes.delete(5000));

			return this._handleInput(toAdd, queue, msg, voiceChannel, fetchMessage);
		}

		return fetchMessage.edit('❔ Nothing found. Maybe made a typo?')
			.then((mes: Message) => mes.delete(5000));
	}

	/**
	 * Adds a video or an array of vidoes to the queue and joins the voice channel when necessary.
	 * @param {video | video[]} video Video or array of videos to add.
	 * @param {queue} queue The queue to add to.
	 * @param {CommandMessage} msg Triggering CommandMessage.
	 * @param {VoiceChannel} voiceChannel The voice channel to join.
	 * @param {Message} fetchMessage The message to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _handleInput(video: video | video[], queue: Queue, msg: CommandMessage, voiceChannel: VoiceChannel, fetchMessage: Message): Promise<Message> {
		if (!queue || !queue.length) {
			if (!queue) {
				queue = new Queue(msg.channel as TextChannel, voiceChannel);
				this.queue.set(msg.guild.id, queue);
			}

			const result: string | RichEmbed = video instanceof Array ? this._addPlaylist(msg, video) : this._add(msg, video);
			if (typeof result === 'string') {
				this.queue.delete(msg.guild.id);
				return fetchMessage.edit(result)
					.then((mes: Message) => mes.delete(30000));
			}

			try {
				await queue.join();
				await this._play(msg.guild.id);
				return fetchMessage.delete().catch(() => null);
			} catch (err) {
				logger.log('summon', msg.guild.id, 'join', err);
				this.queue.delete(msg.guild.id);
				return fetchMessage.edit('❌ There was an error while joining your channel, such a shame!', { embed: null });
			}
		} else {
			const result: string | RichEmbed = video instanceof Array ? this._addPlaylist(msg, video) : this._add(msg, video);
			if (typeof result === 'string') {
				return fetchMessage.edit(result, { embed: null })
					.then((mes: Message) => mes.delete(10000));
			}

			return fetchMessage.edit('', { embed: result })
				.then((mes: Message) => mes.delete(5000));
		}
	}

	/**
	 * Adds a single video to the queue.
	 * @param {CommandMessage} msg Triggering CommandMessage.
	 * @param {video} video Video to add.
	 * @returns {RichEmbed | string} Returns a string on failure, a RichEmbed upon success.
	 * @private
	 */
	private _add(msg: CommandMessage, video: video): RichEmbed | string {
		const queue: Queue = this.queue.get(msg.guild.id);

		if (video.durationSeconds === 0) {
			return '❌ Live streams are not supported.';
		}
		if (queue.isAlreadyQueued(video.id)) {
			return '⚠ That song is already in the queue.';
		}
		if (video.durationSeconds > 60 * 60) {
			return 'ℹ That song is too long, max length is one hour.';
		}

		const song: Song = new Song(video, msg.member);
		queue.push(song);
		return new RichEmbed()
			.setAuthor(song.username, song.avatar)
			.setTimestamp()
			.setImage(song.thumbnail)
			.setColor(0xFFFF00)
			.setFooter('has been added.', this.client.user.displayAvatarURL)
			.setDescription(stripIndents
				`${queue.loop ? '**Loop is enabled**\n' : ''}**++** [${song.name}](${song.url})
				Length: ${song.lengthString}`);
	}

	/**
	 * Adds a playlist (array of video objects) to the playlist.
	 * @param {CommandMessage} msg Triggering CommandMessage.
	 * @param {video[]} videos Array of video objects to add to the queue.
	 * @returns {RichEmbed | string} Returns a string on failure, a RichEmbed upon success.
	 * @private
	 */
	private _addPlaylist(msg: CommandMessage, videos: video[]): RichEmbed | string {
		const queue: Queue = this.queue.get(msg.guild.id);
		let ignored: number = 0;
		let lastsong: Song;

		for (const video of videos) {
			if (video.durationSeconds === 0
				|| video.durationSeconds > 60 * 60
				|| queue.isAlreadyQueued(video.id)
			) {
				ignored++;
				continue;
			}

			lastsong = new Song(video, msg.member);
			queue.push(lastsong);
		}

		if (!lastsong) return 'No song qualifies for adding. Maybe all of them are already queued or too long.';
		return new RichEmbed()
			.setAuthor(lastsong.username, lastsong.avatar)
			.setTimestamp()
			.setImage(lastsong.thumbnail)
			.setColor(0xFFFF00)
			.setFooter('has been added.', this.client.user.displayAvatarURL)
			.setDescription(stripIndents
				`${queue.loop ? '**Loop is enabled**\n' : ''}Added \`${videos.length - ignored}\`/\`${videos.length}\` of your requested songs.

				Full queue length: ${Song.timeString(queue.totalLength)}
      			Use ${msg.anyUsage('queue', (msg.guild as GuildExtension).commandPrefix, this.client.user)} to see what has been added.`);
	}

	/**
	 * Let the user pick one of the search results.
	 * @param {CommandMessage} msg The message to prompt from.
	 * @param {video[]} videos The video array to let the user pick from.
	 * @param {Message} statusmsg Optional message to use to display the choices.
	 * @param {number} [index=0] The index for the current video.
	 * @returns {video} The picked video.
	 * @private
	 */
	private async _chooseSong(msg: CommandMessage, videos: video[], statusmsg?: Message, index: number = 0): Promise<video> {
		const video: video = videos[index];
		if (!video) {
			if (statusmsg) {
				statusmsg.delete().catch(() => null);
				msg.delete().catch(() => null);
			}
			return null;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x9370DB).setTitle(video.title)
			.setImage(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
			.setDescription(`Length: ${Song.timeString(video.durationSeconds)}`)
			.setFooter(`Result ${index + 1} from ${videos.length} results.`, this.client.user.avatarURL);

		if (statusmsg) statusmsg = await statusmsg.edit({ embed });
		else statusmsg = await msg.embed(embed) as Message;

		const argument: ArgumentInfo = {
			key: 'choice',
			prompt: 'Respond either with `y` to pick this video, or with `n` for the next result.\n',
			type: 'boolean'
		};

		const choice: boolean = await this._util.prompt<boolean>(msg, argument).catch(() => null);

		if (choice === null) return statusmsg.delete().then(() => null).catch(() => null);

		if (choice) return video;
		else if (!choice) return this._chooseSong(msg, videos, statusmsg, index + 1);
		else return null;
	}

	/**
	 * Method that actually plays the music
	 * @param {string} guildID ID of the guild to play music in.
	 * @param {song} song The song to play.
	 * @param {boolean} [stopped=false] Whether the playing was stopped through a command.
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _play(guildID: string, stopped: boolean = false): Promise<void> {
		const queue: Queue = this.queue.get(guildID);
		const { currentSong, loop } = queue;

		if (queue.statusMessage) queue.statusMessage.delete().catch(() => null);
		queue.clearTimeout();

		if (!currentSong) {
			queue.emptyQueue(stopped, this.queue);
			return;
		}

		queue.statusMessage = await queue.sendText({
			embed: new RichEmbed().setColor(0x00ff08)
				.setAuthor(currentSong.username, currentSong.avatar)
				.setDescription(stripIndents
					`${loop ? '**Loop enabled**\n' : ''}**>>** [${currentSong.name}](${currentSong.url})
        			Length: ${currentSong.lengthString}`)
				.setImage(currentSong.thumbnail)
				.setFooter('is now being played.', this.client.user.displayAvatarURL)
				.setTimestamp()
		}) as Message;

		let streamErrored: boolean = false;
		const startTime: number = Date.now();

		const stream: Stream = yt(currentSong.url, { filter: 'audioonly' })
			.on('error', async (err: Error) => {
				streamErrored = true;
				logger.log('ytdl', guildID, err);
				await queue.statusMessage.edit('❌ An error occured while playing the YouTube stream.', { embed: null });
				queue.statusMessage = null;
				queue.shift(true);
				this._play(guildID);
			})

			.once('end', () => {
				logger.log('musicInfo', guildID, 'Piping to file finished after', (Song.timeString((Date.now() - startTime) / 1000)));
				const dispatcher: StreamDispatcher = queue.connection.playFile(`./tempmusicfile_${guildID}`, { passes: 2 })

					.on('error', async (err: Error) => {
						logger.log('dispatcher', guildID, err);
						await queue.statusMessage.edit(`❌ An internal error occured while playing.`);
						queue.statusMessage = null;
					})

					.on('start', () => {
						logger.log('musicInfo', guildID, 'Dispatcher started.');
					})

					.on('end', (reason: string) => {
						logger.log('musicInfo', guildID, `Song finished after ${Song.timeString(Math.floor(dispatcher.time / 1000))} / ${currentSong.lengthString} ${reason ? `Reason: ${reason}` : ''}`);
						(dispatcher.stream as any).destroy();

						if (streamErrored) return;

						queue.shift();

						const stop: boolean = reason === 'stop';
						if (stop || !queue.currentSong) this.client.setTimeout(() => (unlink(`./tempmusicfile_${guildID}`, (e: Error) => e && error(guildID, e))), 500);
						this._play(guildID, stop);
					});

				(queue.connection.player.opusEncoder as any).setPLP(0.01);
				dispatcher.setVolumeLogarithmic(queue.volume / 5);
				currentSong.dispatcher = dispatcher;
				currentSong.playing = true;
			});

		stream.pipe(createWriteStream(`./tempmusicfile_${guildID}`));
		logger.log('musicInfo', guildID, 'Piping to file started for: ', currentSong.name);
	}
};
