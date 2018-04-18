import { GuildMember, Snowflake, TextChannel, VoiceConnection } from 'discord.js';
import { Logger, logger, Message } from 'yamdbf';
import * as ytdl from 'ytdl-core';

import { BetterResourceProxy } from '../localization/LocalizationStrings';
import { SongEmbedType } from '../types/SongEmbedType';
import { RavenUtil } from '../util/RavenUtil';
import { Util } from '../util/Util';
import { Client } from './Client';
import { Queue } from './Queue';
import { Song } from './Song';

export class MusicPlayer extends Map<Snowflake, Queue>
{
	/**
	 * Associated client
	 * @private
	 * @readonly
	 */
	private readonly _client: Client;

	/**
	 * Proxied reference to the logger
	 * @private
	 * @readonly
	 */
	@logger('MUSICPLAYER')
	private readonly _logger: Logger;

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

		// the bug of the not cached guildmember of the bot
		// probably duo being kicked from the guild while connected to voice
		// or from the voice channel by deleting it
		if (!voiceChannel)
		{
			queue.clear();
			queue.emtpyChannel(false);
			if (queue.dispatcher) queue.dispatcher.end('stop');

			this.delete(newMember.guild.id);

			return;
		}

		// member didn't move
		if (oldMember.voiceChannel === newMember.voiceChannel) return;
		// neither the old nor the new is the current channel of the bot
		if (oldMember.voiceChannel !== voiceChannel && newMember.voiceChannel !== voiceChannel) return;

		if (voiceChannel.members.size > 1)
		{
			queue.emtpyChannel(false);
		}
		else
		{
			queue.emtpyChannel(true);
		}
	}

	/**
	 * Adds a Song or an array of Songs to the current playback, or starts it if there is none.
	 * @param {ResourceProxy} res
	 * @param {Message} message
	 * @param {Song|Song[]} input Song(s) to add
	 * @returns {Promise<boolean>}
	 */
	public async add(res: BetterResourceProxy, { guild, channel, member }: Message, input: Song | Song[]): Promise<boolean>
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
			queue = new Queue(this._client, res, channel as TextChannel);
			this.set(guild.id, queue);
		}
		if (input instanceof Array) queue.concat(input);
		else queue.push(input);

		try
		{
			queue.connection = await member.voiceChannel.join();
			await this._play(guild.id);
		}
		catch (error)
		{
			RavenUtil.error('MusicPlayer', error);
			this.delete(guild.id);
			channel.send(res.MUSIC_JOIN_FAILED({ message: error.message }))
				.catch(() => null);
		}

		return true;
	}

	/**
	 * Starts a new Song in the provided guild.
	 * @param {string} guildID
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _play(guildID: string): Promise<void>
	{
		this._logger.debug(`_play: (${guildID}) Entered method`);

		const queue: Queue = this.get(guildID);
		if (!queue)
		{
			this._logger.debug(`_play (${guildID}) Queue is falsy`);
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

		const { currentSong }: Queue = queue;

		if (!currentSong)
		{
			this._logger.debug(`_play: (${guildID}) No more songs, disconnecting...`);
			this.delete(guildID);
			// channel does not exists when kicked from it by deleting or the guild as whole
			if (queue.voiceChannel)
			{
				queue.voiceChannel.leave();
			}

			return;
		}

		queue.statusMessage = await queue.textChannel
			.send(currentSong.embed(SongEmbedType.PLAYING))
			.catch(() => null);

		queue.dispatcher = queue.connection.playStream(ytdl(currentSong.url), { passes: 2 })

			.once('error', async (error: Error) =>
			{
				RavenUtil.error('MusicPlayer | dispatcher', error);

				queue.statusMessage = await queue.statusMessage.edit(
					queue.res.MUSIC_PLAY_ERROR(
						{
							message: error.message,
						},
					),
					{ embed: null },
				)
					.then(() => null)
					.catch(() => null);
			})

			.once('start', () => this._logger.log(`DISPATCHER: (${guildID}) start`))

			.once('end', (reason: string) =>
			{
				const playedTime: string = Util.timeString(Math.floor(queue.dispatcher.time / 1000));

				this._logger.log(
					`DISPATCHER: (${guildID})`,
					`Song finished after ${playedTime} / ${queue.currentSong ? queue.currentSong.lengthString : 'No current song'};`,
					reason || 'No reason',
				);

				(queue.dispatcher.stream as any).destroy();
				queue.dispatcher.removeAllListeners();
				queue.dispatcher = null;

				if ((!['stop', 'skip'].includes(reason) && queue.loop))
				{
					queue.push(queue.shift());
				}
				else
				{
					queue.shift();
				}

				this._play(guildID).catch((_playError: Error) =>
				{
					RavenUtil.error('MusicPlayer | _play', _playError);
					queue.textChannel.send(
						queue.res.MUSIC_PLAY_ERROR(
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
