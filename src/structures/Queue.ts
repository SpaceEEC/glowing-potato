import { Guild, StreamDispatcher, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { Logger, logger, Message } from 'yamdbf';

import { BetterResourceProxy } from '../localization/LocalizationStrings';
import { PaginatedPage } from '../types/PaginatedPage';
import { SongEmbedType } from '../types/SongEmbedType';
import { RavenUtil } from '../util/RavenUtil';
import { Util } from '../util/Util';
import { Client } from './Client';
import { RichEmbed } from './RichEmbed';
import { Song } from './Song';

/**
 * Represents a queue, which stores songs, settings
 * and other informations about the current playback in a guild.
 */
export class Queue
{
	/**
	 * Current voice connection of the queue
	 */
	public connection: VoiceConnection;
	/**
	 * Current stream dispatcher of the queue
	 */
	public dispatcher: StreamDispatcher;
	/**
	 * Status message that usually displays the current song
	 */
	public statusMessage: Message;

	/**
	 * Resource loader for this queue
	 * @readonly
	 */
	public readonly res: BetterResourceProxy;

	/**
	 * The text channel this queue has been started
	 * @readonly
	 */
	public readonly textChannel: TextChannel;

	/**
	 * Reference to the client
	 * @private
	 * @readonly
	 */
	private readonly _client: Client;
	/**
	 * Proxied reference to the logger
	 * @private
	 * @readonly
	 */
	@logger('QUEUE')
	private readonly _logger: Logger;
	/**
	 * Whether the loop is enabled
	 * @private
	 */
	private _loop: boolean;
	/**
	 * Array of songs that are currently queued
	 * @private
	 */
	private _songs: Song[];
	/**
	 * The current volume
	 * (see getter and setter)
	 * @private
	 */
	private _volume: number;
	/**
	 * Current timeout, if any
	 * @private
	 */
	private _timeout: NodeJS.Timer;

	/**
	 * Instantiates a new queue for the guild the textchannel is in.
	 * @param {Client} client
	 * @param {ResourceProxy} res
	 * @param {TextChannel} textChannel The text channel this queue should be bound to
	 */
	public constructor(client: Client, res: BetterResourceProxy, textChannel: TextChannel)
	{
		this._logger.debug(`(${textChannel.guild.id}) Instantiating queue`);

		this.connection = null;
		this.statusMessage = null;

		this.res = res;
		this.textChannel = textChannel;

		this._client = client;
		this._loop = false;
		this._songs = [];
		client.storage.guilds.get(textChannel.guild.id).get('volume')
			.then((volume: number) => this._volume = volume || 2);
	}

	/**
	 * Sets or removes an timouet if the channel is or was empty.
	 * @param {boolean} empty Whether the channel is empty
	 * @returns {Promise<void>}
	 */
	public async emtpyChannel(empty: boolean): Promise<void>
	{
		this._logger.debug('EMPTYCHANNEL', `(${this.textChannel.guild.id})`, String(empty));

		if (!empty)
		{
			if (this._timeout)
			{
				this.textChannel.client.clearTimeout(this._timeout);
				this._timeout = null;

				if (this.currentSong)
				{
					const embed: RichEmbed = this.currentSong.embed(SongEmbedType.PLAYING);

					if (this.statusMessage)
					{
						this.statusMessage = await this.statusMessage
							.edit('', embed)
							.catch(() => null);
					}
					else
					{
						this.statusMessage = await this.textChannel
							.send(embed)
							.catch(() => null);
					}
				}
				else if (this.statusMessage)
				{
					this.statusMessage.delete().catch(() => null);
				}
			}

			return;
		}

		if (this._timeout) this.textChannel.client.clearTimeout(this._timeout);
		if (this.statusMessage) this.statusMessage.delete().catch(() => null);

		this.statusMessage = await this.textChannel
			.send(this.res.MUSIC_EMPTY_TIMEOUT())
			.catch(() => null);

		this._timeout = this.textChannel.client.setTimeout(() =>
		{
			if (this.statusMessage) this.statusMessage.delete().catch(() => null);
			this._client.musicPlayer.delete(this.textChannel.guild.id);
			if (!this.voiceChannel)
			{
				if (this.textChannel.guild.voiceConnection)
				{
					this.textChannel.guild.voiceConnection.disconnect();
				}
			}
			else
			{
				this.voiceChannel.leave();
			}
		}, 3e4);
	}

	/**
	 * Paginates the queue and returns the requested page alongside other meta data.
	 * @param {number} page The requested page
	 * @returns {PaginatedPage<Song>}
	 */
	public page(page: number): PaginatedPage<Song>
	{
		return Util.paginate(this._songs, page, 11);
	}

	/**
	 * Shuffles the queue with the exception of the first song.
	 * @returns {void}
	 */
	public shuffle(): void
	{
		const array: Song[] = this._songs.slice(1);

		for (let i: number = array.length - 1; i > 0; --i)
		{
			const r: number = Math.floor(Math.random() * (i + 1));
			const t: Song = array[i];
			array[i] = array[r];
			array[r] = t;
		}

		array.unshift(this._songs[0]);
		this._songs = array;
	}

	/**
	 * Removes every song in the queue, except the first.
	 * @returns {void}
	 */
	public clear(): void
	{
		this._songs = this._songs.slice(0, 1);
	}

	/**
	 * Volume of the queue, will be saved when set
	 */
	public get volume(): number
	{
		return this._volume;
	}
	public set volume(volume: number)
	{
		this._volume = volume;
		this._client.storage.guilds.get(this.textChannel.guild.id).set('volume', volume)
			.catch((error: Error) => RavenUtil.error('Queue', error, 'While saving the volume of the queue'));

		if (this.dispatcher) this.dispatcher.setVolumeLogarithmic(volume / 5);
	}

	public get loop(): boolean
	{
		return this._loop;
	}
	public set loop(state: boolean)
	{
		this._loop = state;

		if (this.statusMessage && this._songs.length)
		{
			const embed: RichEmbed = this._songs[0].embed(SongEmbedType.PLAYING);

			this.statusMessage.edit('', embed)
				.then((m: Message) => this.statusMessage = m)
				.catch(() => null);
		}
	}

	/**
	 * The current voice channel
	 * @readonly
	 */
	public get voiceChannel(): VoiceChannel
	{
		if (!this.textChannel.guild.me)
		{
			const guild: Guild = this.textChannel.guild;

			RavenUtil.captureMessage(
				'Queue#voiceChannel',
				'Own guild member is not cached!',
				{
					extra:
					{
						cachedMembersSize: guild.members.size,
						isOwnMemberCached: !!guild.members.get(guild.client.user.id),
						memberCount: guild.memberCount,
						memberIDs: guild.members.keyArray(),
					},
				},
			);

			return null;
		}

		return this.textChannel.guild.me.voiceChannel;
	}

	/**
	 * Whether the current song is being played, or paused / didn't start yet
	 * @readonly
	 */
	public get playing(): boolean
	{
		return this.dispatcher && !this.dispatcher.paused;
	}

	/**
	 * The current (first) song in the queue
	 * @readonly
	 */
	public get currentSong(): Song
	{
		return this._songs[0];
	}

	// region Array<Song> methods
	public get length(): number
	{
		return this._songs.length;
	}

	public push(...songs: Song[]): number
	{
		return this._songs.push(...songs);
	}

	public concat(...items: (Song | Song[])[]): Song[]
	{
		this._songs = this._songs.concat(...items);
		return this._songs;
	}

	public shift(): Song
	{
		return this._songs.shift();
	}

	public slice(start?: number, end?: number): Song[]
	{
		return this._songs.slice(start, end);
	}

	public some(callbackfn: (value: Song, index: number, array: Song[]) => boolean, thisArg?: any): boolean
	{
		return this._songs.some(callbackfn, thisArg);
	}

	public reduce<U = Song>(
		callbackfn: (previousValue: U, currentValue: Song, currentIndex: number, array: Song[]) => U,
		initialValue: U)
		: U
	{
		return this._songs.reduce<U>(callbackfn, initialValue);
	}

	// well, array like from here on
	public removeAt(index: number): Song[]
	{
		return this._songs.splice(index, 1);
	}

	// js should just support index getter >:
	public at(index: number): Song
	{
		return this._songs[index];
	}
	// endregion
}
