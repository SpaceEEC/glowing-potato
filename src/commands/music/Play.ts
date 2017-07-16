import { Collection, Permissions, Snowflake, VoiceChannel } from 'discord.js';
import { Message } from 'yamdbf/bin';
import {
	aliases,
	clientPermissions,
	desc,
	group,
	guildOnly,
	name,
	usage,
	using,
} from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RichEmbed } from '../../structures/RichEmbed';
import { Song } from '../../structures/Song';
import { SongEmbedType } from '../../types/SongEmbedType';
import { Video } from '../../types/Video';
import { Util } from '../../util/Util';
import { YouTubeUtil } from '../../util/YouTubeUtil';

@aliases('search', 'serach')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Plays a song or playlist.')
@name('play')
@group('music')
@guildOnly
@usage('<prefix>play [Limit] <...Query>`\n'
	+ '`[Limit]` (formatted as ``-7``) is an optional amount to search or queue '
	+ '(defaults to `-1` for search and `-20` for playlists)\n'
	+ '`<...Query>` is either the ID, link or name of the requested video or playlist (name is video only)')
export default class PlayCommand extends Command<Client>
{
	// tslint:disable:only-arrow-functions no-shadowed-variable object-literal-sort-keys
	@using(musicRestricted())
	@using(expect({ '<...Query>': 'String' }))
	@using(function(message: Message, args: string[]): [Message, [number, string]]
	{
		if (args[0].match(/^-\d+$/))
		{
			return resolve({
				'<Limit>': 'Number',
				'<...Query>': 'String',
			}).call(this, message, [args.shift().slice(1), args.join(' ').replace(/<(.+)>/g, '$1')]);
		}

		return [message, [0, args.join(' ').replace(/<(.+)>/g, '$1')]];
	})
	@using(expect({
		'<Limit>': 'Number',
		'<...Query>': 'String',
	}))
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable object-literal-sort-keys
	public async action(message: Message, [limit, query]: [number, string]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);
		let voiceChannel: VoiceChannel;

		if (!queue)
		{
			voiceChannel = message.member.voiceChannel;
			if (!voiceChannel)
			{
				return message.channel.send([
					'You are not in a voice channel, I won\'t whisper you the song...',
					'Move into a voice channel!',
				])
					.then((mes: Message) => void mes.delete(5e3))
					.catch(() => undefined);
			}

			const permissions: Permissions = voiceChannel.permissionsFor(message.guild.me);
			if (!permissions.has('CONNECT'))
			{
				return message.channel.send([
					'Your voice channel sure looks nice, but I am unfortunately not allowed to join it.',
					'Better luck next time, buddy.',
				])
					.then((mes: Message) => void mes.delete(5e3))
					.catch(() => undefined);
			}
			if (!permissions.has('SPEAK'))
			{
				return message.channel.send([
					'Your party sure looks nice.',
					'I\'d love to join, but I am unfortunately not allowed to speak there.',
				])
					.then((mes: Message) => void mes.delete(5e3))
					.catch(() => undefined);
			}
		}
		else if (!queue.voiceChannel.members.has(message.author.id))
		{
			return message.channel.send(`I am currently playing in ${queue.voiceChannel.name}, you better join us!`)
				.then((mes: Message) => void mes.delete(5e3))
				.catch(() => undefined);
		}

		const fetchMessage: Message = await message.channel.send('Fetching info...') as Message;

		const video: Video = await YouTubeUtil.getVideo(query);
		this.client.logger.debug('PlayCommand | video', video ? 'found' : 'not found');

		if (video) return this._validateAndAdd(fetchMessage, message, queue, video);

		const playlist: Video[] = await YouTubeUtil.getPlaylist(query, Math.min(limit || 20, 200));
		this.client.logger.debug('PlayCommand | playlist', String(playlist ? playlist.length : playlist), 'items');

		if (playlist) return this._validateAndAdd(fetchMessage, message, queue, playlist);

		const search: Video[] = await YouTubeUtil.searchVideos(query, Math.min(limit || 1, 50));
		this.client.logger.debug('PlayCommand | search', String(search ? search.length : search), 'items');

		if (search)
		{
			const toAdd: Video = search[1]
				? await this._pick(message, search, fetchMessage)
				: search[0];

			if (toAdd) return this._validateAndAdd(fetchMessage, message, queue, toAdd);

			return message.channel.send('Aborting then.')
				.then((mes: Message) => void mes.delete(5e3))
				.catch(() => undefined);
		}

		return fetchMessage.edit('❔ Nothing found. Maybe made a typo?')
			.then((mes: Message) => void mes.delete(5e3))
			.catch(() => undefined);
	}

	private async _validateAndAdd(fetchMessage: Message, message: Message, queue: Queue, input: Video | Video[])
		: Promise<void>
	{
		if (input instanceof Array)
		{
			const songs: Song[] = [];

			let success: number = 0;
			for (const video of input)
			{
				if (!this._validate(video, queue))
				{
					songs.push(new Song(video, message.member));
					++success;
				}
			}

			if (!success)
			{
				return message.channel.send('No song qualified for adding. Maybe all of them are already queued or too long?')
					.then((m: Message) => void m.delete(5e3));
			}

			const fullLength: number = +(queue && queue.reduce((val: number, cur: Song) => val += cur.length, 0))
				+ songs.reduce((val: number, cur: Song) => val += cur.length, 0);
			const lastSong: Song = songs[songs.length - 1];
			// tslint:disable-next-line:no-shadowed-variable that is no shadow variable <.<
			const first: boolean = await this.client.musicPlayer.add(message, songs);

			if (!first)
			{
				return fetchMessage.edit('', {
					embed: new RichEmbed()
						.setAuthor(lastSong.username, lastSong.avatarURL)
						.setColor(0xFFFF00)
						.setFooter('added songs', this.client.user.avatarURL)
						.setDescription([
							`Added ${songs.length} / ${input.length} of your requested songs.`,
							`Full queue length: ${Util.timeString(fullLength)}`,
						].join('\n')),
				}).then((m: Message) => void m.delete(5e3));
			}
			return fetchMessage.delete()
				.then(() => undefined)
				.catch(() => null);
		}

		const failed: string = this._validate(input, queue);
		if (failed)
		{
			return fetchMessage.edit(failed, { embed: null })
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const song: Song = new Song(input, message.member);
		const first: boolean = await this.client.musicPlayer.add(message, song);

		if (!first)
		{
			return fetchMessage.edit('', { embed: song.embed(SongEmbedType.ADDED) })
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		return fetchMessage.delete()
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}

	private _validate(video: Video, queue: Queue): string
	{
		if (queue && queue.some((song: Song) => song.id === video.id))
		{
			return '⚠ That song is already in the queue.';
		}
		if (video.durationSeconds > 36e2)
		{
			return 'ℹ That song is too long, max length is one hour.';
		}

		return null;
	}

	private async _pick(message: Message, videos: Video[], statusMessage: Message, index: number = 0): Promise<Video>
	{
		const video: Video = videos[index];

		// when nothing is left to pick automatically dismiss
		if (!video)
		{
			if (message.deletable)
			{
				message.delete()
					.catch(() => null);
			}

			return null;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x9370DB).setTitle(video.title)
			.setImage(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
			.setDescription([
				`Length: ${video.durationSeconds ? Util.timeString(video.durationSeconds) : 'Livestream'}`,
				'',
				'Respond with either `y` to select this video or with `n` for the next result.',
			])
			.setFooter(`Result ${index + 1} from ${videos.length} results.`,
			message.author.displayAvatarURL);

		statusMessage = statusMessage
			? await statusMessage.edit(message.author.toString(), { embed }).catch(() => null)
			: await message.channel.send(message.author.toString(), { embed }).catch(() => null);

		const response: Message = await message.channel.awaitMessages(
			(m: Message) => m.author.id === message.author.id,
			{ maxMatches: 1, time: 3e4 },
		).then((collected: Collection<Snowflake, Message>) => collected.first());
		if (response && response.deletable) response.delete().catch(() => null);

		if (!response || !['y', 'n'].includes(response.content.split(' ')[0].toLowerCase()))
		{
			statusMessage.delete().catch(() => null);
			return null;
		}

		if (response.content.split(' ')[0].toLowerCase() === 'n')
		{
			return this._pick(message, videos, statusMessage, ++index);
		}

		return video;
	}
}
