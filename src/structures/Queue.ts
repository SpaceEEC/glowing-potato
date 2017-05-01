import { Collection, GuildMember, Message, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';

import Song from './Song';

const { util }: { util: any } = require('discord.js-commando');

export type Page = { page: number, items: Song[], maxPage: number };

/** Represents a queue. */
export default class Queue {
	/** The current connection of the queue */
	public connection: VoiceConnection;
	/** Whether the loop is enabled */
	public loop: boolean;
	/** Status message that usually display the current song */
	public statusMessage: Message;

	private _emptyPlayListTimeout: NodeJS.Timer;
	private _songs: Song[];
	private _textChannel: TextChannel;
	private _volume: number;
	private _voiceChannel: VoiceChannel;

	private _client: CommandoClient;
	private _guildID: string;

	/**
	 * Intializes a queue for that guild.
	 * @param {TextChannel} textChannel The textchannel to bind the queue to
	 * @param {VoiceChannel} voiceChannel To bind the bot to
	 */
	constructor(textChannel: TextChannel, voiceChannel: VoiceChannel) {
		this._client = textChannel.client as CommandoClient;
		this._guildID = textChannel.guild.id;

		this._songs = [];
		this._textChannel = textChannel;
		this._volume = this._client.provider.get(this._guildID, 'volume', 2);
		this._voiceChannel = voiceChannel;

		this.connection = null;
		this._emptyPlayListTimeout = null;
		this.loop = false;
		this.statusMessage = null;
	}

	/**
	 * Leaves the queue, after 30 seconds when run out of songs, instantly when stopped.
	 * @param {boolean} stop Whether the queue has been stopped
	 * @param {Map<string, Queue>} queue The queue map to delete this queue from
	 * @returns {Promise<void>}
	 */
	public async emptyQueue(stop: boolean, queue: Map<string, Queue>): Promise<void> {
		if (this._emptyPlayListTimeout) {
			this._client.clearTimeout(this._emptyPlayListTimeout);
			this._emptyPlayListTimeout = null;
		}

		if (stop) {
			queue.delete(this._guildID);
			return this._voiceChannel.leave();
		}

		this.statusMessage = await this._textChannel.send('The queue is empty, I\'ll wait another 30 seconds for new songs before leaving.') as Message;

		this._emptyPlayListTimeout = this._client.setTimeout(() => {
			this.statusMessage.delete().catch(() => null);
			queue.delete(this._guildID);
			this._voiceChannel.leave();
		}, 30000);
	}

	/**
	 * Clears the leaveTimeout when it's active.
	 * @returns {void}
	 */
	public clearTimeout(): void {
		if (this._emptyPlayListTimeout) {
			this._client.clearTimeout(this._emptyPlayListTimeout);
			this._emptyPlayListTimeout = null;
		}
	}

	/**
	 * Checks whether a song with that ID is already queued.
	 * @param {string} id The ID of the song
	 * @returns {boolean}
	 */
	public isAlreadyQueued(id: string): boolean {
		return this._songs.some((song: Song) => song.id === id);
	}

	/**
	 * Joins a voice channel.
	 * @param {?voiceChannel} voiceChannel The voice channel to join to, defaults to the currents one
	 * @returns {Promise<void>}
	 */
	public async join(voiceChannel?: VoiceChannel): Promise<void> {
		this.connection = voiceChannel ? await voiceChannel.join() : await this._voiceChannel.join();
		this._voiceChannel = this.connection.channel;
	}

	/**
	 * Paginates the queue and returns the requested page.
	 * @param {number} page The page to be requested
	 */
	public page(page: number): Page {
		return util.paginate(this._songs, page, 11);
	}

	/**
	 * Adds a song to the queue
	 * @param {Song} song The song to be added
	 * @return {number} The new amount of songs
	 */
	public push(song: Song): number {
		return this._songs.push(song);
	}

	/**
	 * Sends a message to the current text channel.
	 * @param {?any} content Content, can be omitted
	 * @param {?any} options Options, can also be omitted
	 * @returns {Promise<Message | Message[]>}
	 */
	public sendText(content?: any, options?: any): Promise<Message | Message[]> {
		return this._textChannel.send(content, options);
	}

	/**
	 * Shifts the queue, removing the first song.
	 * Readds it to last position when the loop is enabled unless forceShift is true.
	 * @param {?boolean}
	 * @returns {void}
	 */
	public shift(forceShift?: boolean): void {
		if (this.loop && !forceShift) this._songs.push(this._songs.slice(0, 1)[0]);
		else this._songs = this._songs.slice(1);
	}

	/**
	 * Shuffles the queue with the exception that the first song stays the first song.
	 * @returns {void}
	 */
	public shuffle(): void {
		const array: Song[] = this._songs.slice(1);

		for (let i: number = array.length - 1; i > 0; i--) {
			const randomIndex: number = Math.floor(Math.random() * (i + 1));
			const temp: Song = array[i];
			array[i] = array[randomIndex];
			array[randomIndex] = temp;
		}

		array.unshift(this._songs[0]);
		this._songs = array;
	}

	/**
	 * Skips the first or removes the specified song from the queue.
	 * @param {number} [index=0] The index to remove, if omitted the current song will be skipped
	 * @returns {void}
	 */
	public skip(index: number = 0): void {
		if (!index) this._songs[0].dispatcher.end('skip');
		else this._songs.splice(index, 1);
	}

	/**
	 * Clears the queue and ends the dispatcher with reason 'stop'.
	 * @returns {void}
	 */
	public stop(): void {
		this._songs = this._songs.slice(0, 1);
		if (this._songs[0].dispatcher) this._songs[0].dispatcher.end('stop');
	}

	/**
	 * Gets a song by index.
	 * @param {number} index The index of the Song get
	 * @returns {Song}
	 */
	public Song(index: number): Song {
		return this._songs[index];
	}

	// getter and setter //

	/** The current song
	 *  @readonly
	 */
	public get currentSong(): Song {
		return this._songs[0];
	}

	/**
	 * The time the current dispatcher is playing in seconds
	 * Defaults to 0 if dispatcher hasn't started yet
	 * @readonly
	 */
	public get currentTime(): number {
		return this._songs[0].dispatcher
			? this._songs[0].dispatcher.time / 1000
			: 0;
	}

	/** Whether the queue should or is playing */
	public get playing(): boolean {
		return this._songs[0].playing;
	}

	public set playing(play: boolean) {
		if (play) {
			this._songs[0].dispatcher.resume();
			this._songs[0].playing = true;
		} else {
			this._songs[0].dispatcher.pause();
			this._songs[0].playing = false;
		}
	}

	/** The amount of songs in the queue
	 *  @readonly
	 */
	public get length(): number {
		return this._songs.length;
	}

	/** The total length of all songs combined in seconds
	 *  @readonly
	 */
	public get totalLength(): number {
		return this._songs.reduce((a: number, b: Song) => a + b.length, 0);
	}

	/** The members of the current voice channel
	 * @readonly
	 */
	public get vcMembers(): Collection<string, GuildMember> {
		return this._voiceChannel.members;
	}

	/** The name of the current voice channel
	 *  @readonly
	 */
	public get vcName(): string {
		return this._voiceChannel.name;
	}

	/** The volume of the queue, will be saved when set */
	public get volume(): number {
		return this._volume;
	}

	public set volume(volume: number) {
		this._client.provider.set(this._guildID, 'volume', volume);
		if (this._songs[0].dispatcher) this._songs[0].dispatcher.setVolumeLogarithmic(volume / 5);
		this._volume = volume;
	}
};
