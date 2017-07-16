import { GuildMember, Snowflake, TextChannel, VoiceConnection } from 'discord.js';
import { createWriteStream, unlink, WriteStream } from 'fs';
import { Message, Time } from 'yamdbf/bin';
import * as ytdl from 'ytdl-core';

import { PaginatedPage } from '../types/PaginatedPage';
import { SongEmbedType } from '../types/SongEmbedType';
import { TimeoutType } from '../types/TimeoutType';
import { RavenUtil } from '../util/RavenUtil';
import { Util } from '../util/Util';
import { Client } from './Client';
import { Queue } from './Queue';
import { RichEmbed } from './RichEmbed';
import { Song } from './Song';

export class MusicPlayer extends Map<Snowflake, Queue>
{
	/**
	 * Associated client
	 * @private
	 */
	private _client: Client;

	/**
	 * Instantiates the MusicPlayer
	 * @param {Client} client
	 */
	public constructor(client: Client)
	{
		super();
		this._client = client;
	}

	/**
	 * Handles the voice state update event, sets or removes an timeout
	 * @param {GuildMember} oldMember
	 * @param {GuildMember} newMember
	 * @returns {void}
	 */
	public handleVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): void
	{
		const queue: Queue = this.get(newMember.guild.id);

		if (!queue) return;

		const { voiceChannel }: Queue = queue;

		if (oldMember.voiceChannel === newMember.voiceChannel
			|| (oldMember.voiceChannel !== voiceChannel && newMember.voiceChannel !== voiceChannel)
		) return;

		if (voiceChannel.members.size - 1)
		{
			queue.timeout(TimeoutType.CHANNEL, false);
		}
		else
		{
			queue.timeout(TimeoutType.CHANNEL, true);
		}
	}

	/**
	 * Outputs the current queue.
	 * @param {Message} message
	 * @param {number} page The requested page
	 * @returns {Promise<void>}
	 */
	public queue(message: Message, page: number): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send('There is nothing being played at the moment, just queue something up.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (queue.length === 1) return this.nowPlaying(message);

		const { items, maxPage }: PaginatedPage<Song> = queue.page(page);
		const fullLength: string = Util.timeString(queue.reduce((p: number, c: Song) => p += c.length, 0));

		let i: number = (page - 1) * 11;
		const currentPage: string[] = items
			.map((song: Song) => `\`${i++}.\` ${song.lengthString} - [${song.name}](${song.url})`);

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setTitle(`Queued up Songs: ${queue.length} | Queue length: ${fullLength}`)
			.setFooter(`Page ${page} of ${maxPage}.`);

		if (page === 1)
		{
			const { currentSong, dispatcher, playing, loop } = queue;
			const currentTime: number = dispatcher ? dispatcher.time / 1000 : 0;

			// ugly string builder start
			let pageOne: string = '';
			if (loop) pageOne += '**Queue is enabled**\n';
			if (playing) pageOne += '**Currently playing:**\n';
			else pageOne += '**Currently paused:**\n';
			pageOne += `[${currentSong.name}](${currentSong.url})\n`
				+ `**Time:** ${currentSong.timeLeft(currentTime)} (${Util.timeString(currentTime)}/${currentSong.lengthString})`;
			if (currentPage.length !== 1) pageOne += `\u200b\n\n**Queue:**`;
			// ugly string builder end

			currentPage.splice(0, 1, pageOne);
			embed.setThumbnail(currentSong.thumbnailURL);
		}
		else if (queue.loop)
		{
			currentPage[0] = `**Loop is enabled!**\n${currentPage[0]}`;
		}

		embed.setDescription(currentPage);

		return message.channel.send({ embed })
			.then((m: Message) => m.delete(3e4))
			.catch(() => null);

	}

	/**
	 * Summons the bot to the calling voice channel.
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public async summon(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send('There is nothing being played at the moment, just queue something up.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const joinMessage: Message = await message.channel.send('Joining your channel...') as Message;
		try
		{
			await message.member.voiceChannel.join();
			return joinMessage.edit('Joined your channel, party will now continue here!')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}
		catch (error)
		{
			RavenUtil.error('MusicPlayer | Summon', error);
			return joinMessage.edit([
				'An error occurred while joining your channel, such a shame.',
				'',
				'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
			])
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}
	}

	/**
	 * Removes a song at the specified index.
	 * @param {Message} message
	 * @param {number} index
	 * @returns {Promise<void>}
	 */
	public remove(message: Message, index: number): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send('There is nothing being played at the moment.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (index === 0) return this.skip(message);

		if (!queue.at(index))
		{
			return message.channel.send('The specified entry wasn\'t found!')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const [removed]: Song[] = queue.removeAt(index);

		return message.channel.send(`Removed \`${removed}\` at position ${index}`)
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Stops the current playback and deletes the queue.
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public stop(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send('There is nothing being played at the moment, you can not stop what never has been started.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (!queue.dispatcher)
		{
			return message.channel
				.send('The song didn\'t start yet, duo technical limitation stopping is only available after the song started.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		queue.clear();
		queue.timeout(TimeoutType.CHANNEL, false);
		queue.timeout(TimeoutType.QUEUE, false);
		queue.dispatcher.end('stop');
		this.delete(message.guild.id);

		return message.channel.send('Party is over! 🚪 👈')
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Skips the current song.
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public skip(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send('There is nothing being played at the moment, what do you want to skip?')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (!queue.dispatcher)
		{
			return message.channel
				.send('The song didn\'t start yet, duo technical limitation skipping is only available after the song started.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const { currentSong }: Queue = queue;

		queue.dispatcher.end('skip');

		return message.channel.send(`Skipped \`${currentSong}\`.`)
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Sets or gets the state of the loop in the current guild's playback.
	 * @param {Message} message
	 * @param {?boolean} state
	 * @return {Promise<void>}
	 */
	public async loop(message: Message, state: boolean): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send('There is nothing being played at the moment.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (typeof state !== 'boolean')
		{
			return message.channel.send(`The queue is at the moment ${queue.loop ? 'enabled' : 'disabled'}.`)
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (queue.loop === state)
		{
			return message.channel.send(`The queue is already ${queue.loop ? 'enabled' : 'disabled'}.`)
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		queue.loop = state;

		return message.channel.send(`The queue is now ${queue.loop ? 'enabled' : 'disabled'}.`)
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Sends the currently played song into the current channel.
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public nowPlaying(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send('There is nothing being played at the moment.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const { currentSong }: Queue = queue;

		const embed: RichEmbed = currentSong.embed(SongEmbedType.NP);

		return message.channel.send({ embed })
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Sends the author of the message the currently played song in their guild.
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public save(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send('There is nothing being played at the moment, so nothing you can save.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const embed: RichEmbed = queue.currentSong.embed(SongEmbedType.SAVE);
		embed.author = null;

		return message.author.send({ embed })
			.then(() => undefined)
			.catch(() =>
				message.channel.send('An error occured while sending the DM, did you perhaps have DMs disabled or blocked me?'),
		);

	}

	/**
	 * Shuffles the queue
	 * @param {Message} message
	 * @returns {Promise<void>}
	 */
	public shuffle(message: Message): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue || queue.length < 3)
		{
			return message.channel.send('There is either no queue or there are less then `3` songs queued.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		queue.shuffle();

		return message.channel.send('Queue has been shuffled.')
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Sets or gets the volume of the the queue in the provided guild.
	 * @param {Message} message
	 * @param {?number} volume The volume to set to if any
	 * @returns {Promise<void>}
	 */
	public async volume(message: Message, volume: number): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		const update: boolean = typeof volume === 'number';

		if (queue)
		{
			if (update)
			{
				queue.volume = volume;
			}
			else
			{
				volume = queue.volume;
			}

		}
		else
		{
			if (update)
			{
				await message.guild.storage.set('volume', volume);
			}
			else
			{
				volume = await message.guild.storage.get('volume');
			}
		}

		return message.channel.send(`The ${queue ? 'configurated ' : ''}volume is ${update ? 'now ' : ''}\`${volume}\`.`)
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Pauses or resumes the playback of the queue in the provided guild.
	 * @param {Message} message
	 * @param {boolean} state Whether to resume or pause.
	 * @returns {Promise<void>}
	 */
	public setPlaying(message: Message, state: boolean): Promise<void>
	{
		const queue: Queue = this.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send('That is not possible, there is nothing being played at the moment.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		return message.channel
			.send(queue.setPlaying(state))
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	/**
	 * Adds a Song or an array of Songs to the current playback, or starts it if there is none.
	 * @param {Message} message
	 * @param {Song|Song[]} input Song(s) to add
	 * @returns {Promise<boolean>}
	 */
	public async add({ guild, channel, member }: Message, input: Song | Song[]): Promise<boolean>
	{
		let queue: Queue = this.get(guild.id);
		if (queue)
		{
			if (input instanceof Array) queue.concat(input);
			else queue.push(input);
			return false;
		}
		else
		{
			queue = new Queue(channel as TextChannel);
			this.set(guild.id, queue);
		}
		if (input instanceof Array) queue.concat(input);
		else queue.push(input);

		try
		{
			queue.connection = await member.voiceChannel.join();
			await this._play(guild.id, false);
		}
		catch (error)
		{
			RavenUtil.error('MusicPlayer', error);
			this.delete(guild.id);
			channel.send([
				'❌ There was an error while joining your channel, such a shame!',
				'',
				'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
			])
				.catch(() => null);
		}

		return true;
	}

	/**
	 * Starts a new Song in the provided guild.
	 * @param {string} guildID
	 * @param {boolean} stopped
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _play(guildID: string, stopped: boolean): Promise<void>
	{
		this._client.logger.debug('MusicPlayer', '_play');

		const queue: Queue = this.get(guildID);
		if (!queue)
		{
			this._client.logger.debug('MusicPlayer', 'queue is falsy');
			const connection: VoiceConnection = this._client.voiceConnections.get(guildID);
			if (connection)
			{
				connection.disconnect();
			}

			return;
		}

		if (queue.statusMessage)
		{
			queue.statusMessage.delete()
				.catch(() => null);
		}

		await queue.timeout(TimeoutType.QUEUE, false);

		const { currentSong }: { currentSong: Song } = queue;

		if (!currentSong)
		{
			if (stopped) return queue.voiceChannel.leave();
			return queue.timeout(TimeoutType.QUEUE, true);
		}

		const embed: RichEmbed = currentSong.embed(SongEmbedType.PLAYING);

		queue.statusMessage = await queue.textChannel
			.send({ embed })
			.catch(() => null);

		// js and its sometimes reference, sometimes value types
		const streamErrored: { err: boolean } = { err: false };

		// livestream
		if (!currentSong.length) return this._stream(queue, guildID, streamErrored, currentSong.url);

		const startTime: number = Date.now();

		const stream: WriteStream = ytdl(currentSong.url, { filter: 'audioonly' })

			.once('error', async (error: Error) =>
			{
				RavenUtil.error('MusicPlayer | YTDL', error);
				streamErrored.err = true;

				queue.statusMessage = await queue.statusMessage
					.edit([
						'❌ An error occured while playing the YouTube stream.',
						'',
						'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
					], { embed: null })
					.then(() => null)
					.catch(() => null);

				queue.shift();

				this._play(guildID, false).catch((_playError: Error) =>
				{
					RavenUtil.error('MusicPlayer | _play', _playError);
					queue.textChannel.send([
						'❌ There was an error while playing.',
						`\`${_playError.message}\``,
						'',
						'Consider running `<prefix>stop force`, if the playback is not continuing.',
					]);
				});
			})

			.once('end', () =>
			{
				stream.removeAllListeners();

				this._client.logger.log(
					'MusicPlayer | Pipe',
					'Piping to file finished after',
					Time.difference(Date.now(), startTime).toSimplifiedString(),
				);

				this._stream(queue, guildID, streamErrored);
			})

			.pipe(createWriteStream(`./tempMusicFile_${guildID}`));

		this._client.logger.log('MusicPlayer | Pipe', 'Piping to file started for:', currentSong.name);
	}

	/**
	 * Actually streams the song to the voice channel.
	 * @param {Queue} queue
	 * @param {string} guildID
	 * @param {object} streamErrored
	 * @param {?string} [livestream] Livestream URL if any
	 * @returns {void}
	 */
	private _stream(queue: Queue, guildID: string, streamErrored: { err: boolean }, livestream?: string): void
	{
		this._client.logger.debug('MusicPlayer', '_stream');

		queue.dispatcher = (livestream
			? queue.connection.playStream(ytdl(livestream), { passes: 2 })
			: queue.connection.playFile(`./tempMusicFile_${guildID}`, { passes: 2 }))

			.once('error', async (error: Error) =>
			{
				RavenUtil.error('MusicPlayer | dispatcher', error);

				queue.statusMessage = await queue.statusMessage.edit(
					[
						'❌ An internal error occured while playing.',
						'',
						'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
					],
					{ embed: null },
				)
					.then(() => null)
					.catch(() => null);
			})

			.once('start', () => this._client.logger.log('MusicPlayer | dispatcher', 'start'))

			.once('end', (reason: string) =>
			{

				const playedTime: string = Util.timeString(Math.floor(queue.dispatcher.time / 1000));

				this._client.logger.log(
					'MusicPlayer | dispatcher',
					`Song finished after ${playedTime} / ${queue.currentSong.lengthString};`,
					reason || 'No reason',
				);

				(queue.dispatcher.stream as any).destroy();
				queue.dispatcher.removeAllListeners();
				queue.dispatcher = null;

				if (streamErrored.err)
				{
					this._client.logger.warn('MusicPlayer | Dispatcher', 'Stream errored!');
					return;
				}

				if ((!['stop', 'skip'].includes(reason) && queue.loop))
				{
					queue.push(queue.shift());
				}
				else
				{
					queue.shift();
				}

				if ((reason === 'stop' || !queue.length))
				{
					this._client.setTimeout(
						() =>
						{
							unlink(`./tempMusicFile_${guildID}`, (error: Error) =>
							{
								if (error)
								{
									RavenUtil.error('MusicPlayer | unlink', error);
								}
							});
						},
						5e2,
					);
				}

				this._play(guildID, reason === 'stop').catch((_playError: Error) =>
				{
					RavenUtil.error('MusicPlayer | _play', _playError);
					queue.textChannel.send([
						'❌ There was an error while playing.',
						`\`${_playError.message}\``,
						'',
						'Consider running `<prefix>stop force`, if the playback is not continuing.',
						'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
					]);
				});
			});

		(queue.connection.player.opusEncoder as any).setPLP(0.01);
		queue.dispatcher.setVolumeLogarithmic(queue.volume / 5);
	}
}
