// hey there, copy pasta here
// https://github.com/WeebDev/Commando/blob/master/structures/Song.js
// pretty awesome thing
const { escapeMarkdown } = require('discord.js');
const { oneLineTrim } = require('common-tags');

module.exports = class Song {
	/**
	 * @param {object} video The video object from the youtube api.
	 * @param {object} member The guild member that added that song.
	 */
	constructor(video, member) {
		this.name = escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds ? parseInt(video.durationSeconds) : parseInt(video.duration) / 1000;
		this.member = member;
		this.dispatcher = null;
		this.playing = false;
	}
	/**
	 * @return {string} The Youtube url.
	 */
	get url() {
		return `https://www.youtube.com/watch?v=${this.id}`;
	}
	/**
	 * @returns {string} The Thumbnail url.
	 */
	get thumbnail() {
		const thumbnail = `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
		return thumbnail;
	}
	/**
	 * @returns {string} The username formatted as 'username#discrim (id)'.
	 */
	get username() {
		const name = `${this.member.user.username}#${this.member.user.discriminator} (${this.member.user.id})`;
		return escapeMarkdown(name);
	}
	/**
	 * @returns {string} The displayAvatarURL of the user.
	 */
	get avatar() {
		const avatar = `${this.member.user.displayAvatarURL}`;
		return avatar;
	}
	/**
	 * @returns {string} The full length of the song as string.
	 */
	get lengthString() {
		return this.constructor.timeString(this.length);
	}
	/**
	 * @param {number} currentTime The time the song is at the moment.
	 * @returns {string} The time left as a string.
	 */
	timeLeft(currentTime) {
		return this.constructor.timeString(this.length - currentTime);
	}
	/**
	 * @returns {string} The Song formatted as 'Name (Length)'.
	 */
	toString() {
		return `${this.name} (${this.lengthString})`;
	}
	/**
	 * @param {number} seconds Where the current song is at in seconds.
	 * @param {boolean} forceHours If hours should be forced.
	 * @returns {string} The formatted time string.
	 */
	static timeString(seconds, forceHours = false) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor(seconds % 3600 / 60);
		return oneLineTrim`
			${forceHours || hours >= 1 ? `${hours}:` : ''}
			${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:
			${`0${Math.floor(seconds % 60)}`.slice(-2)}
		`;
	}
};
