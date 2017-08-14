//
// pretty much a copy paste from here
// https://github.com/WeebDev/Hamakaze/blob/master/src/structures/song.ts
//

import { GuildMember, Util as DJSUtil } from 'discord.js';

import {LocalizationStrings as S } from '../localization/LocalizationStrings';
import { SongEmbedOptions, songEmbedOptions } from '../types/SongEmbedOptions';
import { SongEmbedType } from '../types/SongEmbedType';
import { Video } from '../types/Video';
import { Util } from '../util/Util';
import { Client } from './Client';
import { Queue } from './Queue';
import { RichEmbed } from './RichEmbed';

/**
 * Represents a song in a queue.
 */
export class Song
{
	/**
	 * The name of this song
	 */
	public name: string;
	/**
	 * The ID of this song
	 */
	public id: string;
	/**
	 * The length of this song in seconds
	 */
	public length: number;
	/**
	 * The member that requested this song
	 */
	public member: GuildMember;

	/**
	 * Creates a new song from a video.
	 * @param {Video} video The video
	 * @param {GuildMember} member The requesting member
	 */
	public constructor(video: Video, member: GuildMember)
	{
		this.name = DJSUtil.escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds;
		this.member = member;
	}

	/**
	 * The remainding time of this song as a human readable string
	 * @param {number} currentTime
	 * @returns {string}
	 */
	public timeLeft(currentTime: number): string
	{
		return Util.timeString(this.length - currentTime);
	}

	/**
	 * Returns a (template) embed for the specified type.
	 * @param {SongEmbedType} type
	 * @returns {RichEmbed}
	 */
	public embed(type: SongEmbedType): RichEmbed
	{
		const { color, descriptionPrefix, footer }: SongEmbedOptions = songEmbedOptions[type];

		const description: string[] = [];

		if ([SongEmbedType.PLAYING, SongEmbedType.NP].includes(type) && this._queue.loop)
		{
			description.push(this._queue.res(S.MUSIC_SONG_LOOP));
		}

		description.push(`**${descriptionPrefix}** [${this.name}](${this.url})`);

		if (type === SongEmbedType.NP)
		{
			const { dispatcher }: Queue = this._queue;
			const currentTime: number = dispatcher ? dispatcher.time / 1000 : 0;
			const left: string = this.timeLeft(currentTime);
			const current: string = Util.timeString(currentTime);
			description.push(
				this._queue.res(this.length ? S.MUSIC_SONG_NP_DESCRIPTION : S.MUSIC_LIVESTREAM,
					{
						current,
						left,
						length: this.lengthString,
					},
				),
			);
		}
		else
		{
			description.push(
				this._queue.res(this.length ? S.MUSIC_SONGS_GENERIC_DESCRIPTION : S.MUSIC_LIVESTREAM,
					{
						length: this.lengthString,
					},
				),
			);
		}

		return new RichEmbed()
			.setAuthor(this.username, this.avatarURL)
			.setDescription(description)
			.setTimestamp()
			.setImage(this.thumbnailURL)
			.setColor(color)
			.setFooter(this._queue.res(footer), this.member.client.user.displayAvatarURL);
	}

	/**
	 * The song as: name (lengthString)
	 * @returns {string}
	 */
	public toString(): string
	{
		return `${this.name} (${this.lengthString})`;
	}

	/**
	 * The youtube url to this song
	 * @readonly
	 */
	public get url(): string
	{
		return `https://www.youtube.com/watch?v=${this.id}`;
	}

	/**
	 * The url pointing to the thumbnail
	 * @readonly
	 */
	public get thumbnailURL(): string
	{
		return `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
	}

	/**
	 * The username of the requesting member, formatted as username#discrim (id)
	 * @readonly
	 */
	public get username(): string
	{
		return DJSUtil.escapeMarkdown(`${this.member.user.tag} (${this.member.user.id})`);
	}

	/**
	 * The avatar url from the requesting member
	 * @readonly
	 */
	public get avatarURL(): string
	{
		return this.member.user.displayAvatarURL;
	}

	/**
	 * The length of this song as a human readable string
	 * @readonly
	 */
	public get lengthString(): string
	{
		return Util.timeString(this.length);
	}

	/**
	 * Shortcut to the relevant queue
	 * @private
	 * @readonly
	 */
	private get _queue(): Queue
	{
		return (this.member.client as Client).musicPlayer.get(this.member.guild.id);
	}
}
