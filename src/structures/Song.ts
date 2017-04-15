// hey there, copy pasta here
// https://github.com/WeebDev/Hamakaze/blob/master/src/structures/song.ts
// pretty awesome thing
import { oneLineTrim } from 'common-tags';
import { GuildMember, StreamDispatcher, Util } from 'discord.js';

export default class Song {
	public static timeString(seconds: number, forceHours = false): string {
		const hours: number = Math.floor(seconds / 3600);
		const minutes: number = Math.floor(seconds % 3600 / 60);

		return oneLineTrim`
			${forceHours || hours >= 1 ? `${hours}:` : ''}
			${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:
			${`0${Math.floor(seconds % 60)}`.slice(-2)}
		`;
	}

	public name: string;
	public id: string;
	public length: number;
	public member: GuildMember;
	public dispatcher: StreamDispatcher;
	public playing: boolean;

	constructor(video: { title: string, id: string, duration?: number, durationSeconds?: number }, member: GuildMember) {
		this.name = Util.escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds ? video.durationSeconds : video.duration / 1000;
		this.member = member;
		this.dispatcher = null;
		this.playing = false;
	}

	get url(): string {
		return `https://www.youtube.com/watch?v=${this.id}`;
	}

	get thumbnail(): string {
		const thumbnail: string = `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
		return thumbnail;
	}

	get username(): string {
		const name: string = `${this.member.user.tag} (${this.member.user.id})`;
		return Util.escapeMarkdown(name);
	}

	get avatar(): string {
		const avatar: string = `${this.member.user.displayAvatarURL}`;
		return avatar;
	}

	get lengthString(): string {
		return Song.timeString(this.length);
	}

	public timeLeft(currentTime: number): string {
		return Song.timeString(this.length - currentTime);
	}

	private _toString(): string {
		return `${this.name} (${this.lengthString})`;
	}
}
