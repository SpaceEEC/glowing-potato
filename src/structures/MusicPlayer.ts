import { GuildMember, Snowflake, TextChannel, VoiceConnection } from 'discord.js';
// import { createWriteStream, unlink, WriteStream } from 'fs';
import { Message, ResourceLoader/*, Time*/ } from 'yamdbf';
import * as ytdl from 'ytdl-core';

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
	 * Adds a Song or an array of Songs to the current playback, or starts it if there is none.
	 * @param {ResourceLoader} res
	 * @param {Message} message
	 * @param {Song|Song[]} input Song(s) to add
	 * @returns {Promise<boolean>}
	 */
	public async add(res: ResourceLoader, { guild, channel, member }: Message, input: Song | Song[]): Promise<boolean>
	{
		let queue: Queue = this.get(guild.id);
		if (queue)
		{
			if (input instanceof Array) queue.concat(input);
			else queue.push(input);

			if (await queue.timeout(TimeoutType.QUEUE, false))
			{
				await this._play(guild.id, false);
				return true;
			}

			return false;
		}
		else
		{
			queue = new Queue(res, channel as TextChannel);
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
			channel.send(res('MUSIC_JOIN_FAILED', { message: error.message }))
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

		const { currentSong }: Queue = queue;

		if (!currentSong)
		{
			if (stopped) return queue.voiceChannel.leave();
			await queue.timeout(TimeoutType.QUEUE, true);
			return;
		}

		const embed: RichEmbed = currentSong.embed(SongEmbedType.PLAYING);

		queue.statusMessage = await queue.textChannel
			.send({ embed })
			.catch(() => null);

		// js and its sometimes reference, sometimes value types
		const streamErrored: { err: boolean } = { err: false };

		// livestream
		/*if (!currentSong.length)*/
		return this._stream(queue, guildID, streamErrored, currentSong.url);

		/*const startTime: number = Date.now();

		const stream: WriteStream = ytdl(currentSong.url, { filter: 'audioonly' })

			.once('error', async (error: Error) =>
			{
				RavenUtil.error('MusicPlayer | YTDL', error);
				streamErrored.err = true;

				queue.statusMessage = await queue.statusMessage
					.edit(res('MUSIC_YOUTUBE_ERROR', { message: error.message }), { embed: null })
					.then(() => null)
					.catch(() => null);

				queue.shift();

				this._play(guildID, false).catch((_playError: Error) =>
				{
					RavenUtil.error('MusicPlayer | _play', _playError);
					queue.textChannel.send(res('MUSIC_PLAY_ERROR', { message: error.message }));
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

		this._client.logger.log('MusicPlayer | Pipe', 'Piping to file started for:', currentSong.name);*/
	}

	/**
	 * Actually streams the song to the voice channel.
	 * @param {Queue} queue
	 * @param {string} guildID
	 * @param {object} streamErrored
	 * @param {?string} [livestream] Livestream URL if any
	 * @returns {void}
	 */
	private _stream(
		queue: Queue,
		guildID: string,
		streamErrored: { err: boolean },
		livestream?: string): void
	{
		this._client.logger.debug('MusicPlayer', '_stream');

		queue.dispatcher = /*(livestream
			?*/ queue.connection.playStream(ytdl(livestream), { passes: 2 })
			/*: queue.connection.playFile(`./tempMusicFile_${guildID}`, { passes: 2 }))*/

			.once('error', async (error: Error) =>
			{
				RavenUtil.error('MusicPlayer | dispatcher', error);

				queue.statusMessage = await queue.statusMessage.edit(
					queue.res('MUSIC_PLAY_ERROR',
						{
							message: error.message,
						},
					),
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

				/*if ((reason === 'stop' || !queue.length))
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
				}*/

				this._play(guildID, reason === 'stop').catch((_playError: Error) =>
				{
					RavenUtil.error('MusicPlayer | _play', _playError);
					queue.textChannel.send(
						queue.res('MUSIC_PLAY_ERROR',
							{
								message: _playError.message,
							},
						),
					);
				});
			});

		(queue.connection.player.opusEncoder as any).setPLP(0.01);
		queue.dispatcher.setVolumeLogarithmic(queue.volume / 5);
	}
}
