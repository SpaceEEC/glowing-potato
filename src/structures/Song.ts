// hey there, copy pasta here
// https://github.com/WeebDev/Hamakaze/blob/master/src/structures/song.ts
// pretty awesome thing
import { oneLineTrim } from 'common-tags';
import { GuildMember, StreamDispatcher, Util } from 'discord.js';

/** Represents a song in the queue. */
export default class Song {
	/**
	 * Converts a number of seconds to a human readable string.
	 * @param {number} seconds The amount of total seconds
	 * @param {boolean} [forceHours=false] Whether to force the display of hours
	 * @returns {string} The final time string
	 * @static
	 */
	public static timeString(seconds: number, forceHours = false): string {
		const hours: number = Math.floor(seconds / 3600);
		const minutes: number = Math.floor(seconds % 3600 / 60);

		return oneLineTrim`
			${forceHours || hours >= 1 ? `${hours}:` : ''}
			${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:
			${`0${Math.floor(seconds % 60)}`.slice(-2)}
		`;
	}
	/** The name of this song */
	public name: string;
	/** The ID of this song */
	public id: string;
	/** The length in seconds of this song */
	public length: number;
	/** The member that requested this song */
	public member: GuildMember;
	/** The dispatcher, if this song is being played at the moment */
	public dispatcher: StreamDispatcher;
	/** Whether this song is currently paused */
	public playing: boolean;

	/**
	 * Creates a new song from a video.
	 * @param {video} video The video
	 * @param {GuildMember} member The requesting member
	 */
	constructor(video: { title: string, id: string, durationSeconds?: number }, member: GuildMember) {
		this.name = Util.escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds;
		this.member = member;
		this.dispatcher = null;
		this.playing = false;
	}

	/** The youtube url to this song */
	get url(): string {
		return `https://www.youtube.com/watch?v=${this.id}`;
	}

	/** The thumbnail */
	get thumbnail(): string {
		return `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
	}

	/** The username of the reqeusting member formatted as username#discrim (id) */
	get username(): string {
		return Util.escapeMarkdown(`${this.member.user.tag} (${this.member.user.id})`);
	}

	/** The avatar url from the requesting member */
	get avatar(): string {
		return `${this.member.user.displayAvatarURL}`;
	}

	/** The length of this song as a human readable string */
	get lengthString(): string {
		return Song.timeString(this.length);
	}
	/** The remainding time of this song as a human readable string */
	public timeLeft(currentTime: number): string {
		return Song.timeString(this.length - currentTime);
	}

	/** The song as: name (lengthString) */
	public toString(): string {
		return `${this.name} (${this.lengthString})`;
	}
}
