
import { StreamDispatcher, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { inspect } from 'util';
import { Message } from 'yamdbf/bin';

import { PaginatedPage } from '../types/PaginatedPage';
import { SongEmbedType } from '../types/SongEmbedType';
import { TimeoutType } from '../types/TimeoutType';
import { Util } from '../util/Util';
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
	 * The text channel this queue has been started
	 * @readonly
	 */
	public readonly textChannel: TextChannel;

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
	 * An emtpy channel or emtpy queue timout
	 * otherwise null.
	 * @private
	 */
	private _timeout: NodeJS.Timer;
	/**
	 * The type of the current timeout.
	 * @private
	 */
	private _timeoutType: TimeoutType;

	/**
	 * Instantiates a new queue for this guild.
	 * @param {TextChannel} textChannel The text channel this queue should be bound to
	 */
	public constructor(textChannel: TextChannel)
	{
		this.connection = null;
		this.statusMessage = null;

		this.textChannel = textChannel;

		this._loop = false;
		this._songs = [];
		Util.client.storage.guilds.get(textChannel.guild.id).get('volume')
			.then((volume: number) => this._volume = volume || 2);
	}

	/**
	 * Sets or removes a timeout of the specified type.
	 * @param {TimeoutType} type Empty QUEUE or CHANNEL
	 * @param {boolean} state Whether it's empty
	 * @returns {Promise<void>}
	 */
	public async timeout(type: TimeoutType, state: boolean): Promise<void>
	{
		const { client }: typeof Util = Util;

		client.logger.debug('Queue', TimeoutType[type], String(state));

		// remove timeout
		if (!state)
		{
			// only if one is present an it's the same type
			if (this._timeout && this._timeoutType === type)
			{
				client.clearTimeout(this._timeout);
				this._timeout = null;
				this._timeoutType = null;

				if (this.currentSong)
				{
					const embed: RichEmbed = this.currentSong.embed(SongEmbedType.PLAYING);

					if (this.statusMessage)
					{
						this.statusMessage = await this.statusMessage
							.edit('', { embed })
							.catch(() => null);
					}
					else
					{
						this.statusMessage = await this.textChannel
							.send({ embed })
							.catch(() => null);
					}
				}
				else if (this.statusMessage) this.statusMessage.delete().catch(() => null);
			}
			return;
		}

		// timer is already present
		if (this._timeout)
		{
			client.clearTimeout(this._timeout);
			this._timeout = null;
			if (this._timeoutType !== type)
			{
				this._timeoutType = null;
				if (this.statusMessage) this.statusMessage.delete().catch(() => null);
				client.musicPlayer.delete(this.textChannel.guild.id);
				this.voiceChannel.leave();
				return;
			}
		}

		if (this.statusMessage) this.statusMessage.delete().catch(() => null);

		this.statusMessage = await this.textChannel
			.send(
			`Since the ${type === TimeoutType.CHANNEL ? 'channe' : 'queue'} is `
			+ 'empty I will wait another `30` seconds for anyone to change that.',
		)
			.catch(() => null);

		this._timeoutType = type;
		this._timeout = client.setTimeout(() =>
		{
			if (this.statusMessage) this.statusMessage.delete().catch(() => null);
			client.musicPlayer.delete(this.textChannel.guild.id);
			this.voiceChannel.leave();
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
	 * Pauses or resumes the current playback.
	 * @param {boolean} state Whether is should be paused or resumed
	 * @returns {?string}
	 */
	public setPlaying(state: boolean): string
	{
		if (!this.dispatcher)
		{
			return 'There is no current dispatcher, perhaps the playback didn\'t start yet?';
		}

		if (this.dispatcher.paused !== state)
		{
			return `The playback is already ${state ? 'resumed' : 'paused'}, isn't it?`;
		}

		if (state) this.dispatcher.resume();
		else this.dispatcher.pause();

		return `Successfully ${state ? 'resumed' : 'paused'} the playback.`;
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
		const { client }: typeof Util = Util;

		this._volume = volume;
		client.storage.guilds.get(this.textChannel.guild.id).set('volume', volume)
			.catch((error: Error) =>
				client.logger.error('Queue', 'An error occured while saving the volume of the queue',
					inspect(error, true, Infinity, true),
				),
		);

		this.dispatcher.setVolumeLogarithmic(volume / 5);
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

			this.statusMessage.edit('', { embed })
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
