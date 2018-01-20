import { Collection, Permissions, Snowflake, VoiceChannel } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RichEmbed } from '../../structures/RichEmbed';
import { Song } from '../../structures/Song';
import { SongEmbedType } from '../../types/SongEmbedType';
import { Video } from '../../types/Video';
import { Util } from '../../util/Util';
import { YouTubeUtil } from '../../util/YouTubeUtil';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect, resolve } = Middleware;

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
	@localizable
	@LogCommandRun
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable object-literal-sort-keys
	public async action(message: Message, [res, limit, query]: [ResourceLoader, number, string]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);
		let voiceChannel: VoiceChannel;

		if (!queue)
		{
			voiceChannel = message.member.voiceChannel;
			if (!voiceChannel)
			{
				return message.channel.send(res(S.MUSIC_NOT_IN_VOICECHANNEL))
					.then((mes: Message) => mes.delete(1e4))
					.catch(() => null);
			}

			const permissions: Permissions = voiceChannel.permissionsFor(message.guild.me);
			if (!permissions.has('CONNECT'))
			{
				return message.channel.send(res(S.MUSIC_NO_CONNECT))
					.then((mes: Message) => mes.delete(1e4))
					.catch(() => null);
			}
			if (!permissions.has('SPEAK'))
			{
				return message.channel.send(res(S.MUSIC_NO_SPEAK))
					.then((mes: Message) => mes.delete(1e4))
					.catch(() => null);
			}
		}
		else if (!queue.voiceChannel.members.has(message.author.id))
		{
			return message.channel.send(res(S.CMD_PLAY_DIFFERENT_CHANNEL, { channel: queue.voiceChannel.name }))
				.then((mes: Message) => mes.delete(1e4))
				.catch(() => null);
		}

		const fetchMessage: Message = await message.channel.send(res(S.CMD_PLAY_FETCHING_MESSAGE)) as Message;

		const video: Video = await YouTubeUtil.getVideo(query);
		this.client.logger.debug('PlayCommand | video', video ? 'found' : 'not found');

		if (video) return this._validateAndAdd(res, fetchMessage, message, queue, video);

		const playlist: Video[] = await YouTubeUtil.getPlaylist(query, Math.min(limit || 20, 200));
		this.client.logger.debug('PlayCommand | playlist', String(playlist ? playlist.length : playlist), 'items');

		if (playlist) return this._validateAndAdd(res, fetchMessage, message, queue, playlist);

		const search: Video[] = await YouTubeUtil.searchVideos(query, Math.min(limit || 1, 50));
		this.client.logger.debug('PlayCommand | search', String(search ? search.length : search), 'items');

		if (search)
		{
			const toAdd: Video = search[1]
				? await this._pick(res, message, search, fetchMessage)
				: search[0];

			if (toAdd) return this._validateAndAdd(res, fetchMessage, message, queue, toAdd);

			return message.channel.send(res(S.CMD_ABORTING))
				.then((mes: Message) => mes.delete(1e4))
				.catch(() => null);
		}

		return fetchMessage.edit(res(S.CMD_PLAY_NOTHING_FOUND))
			.then((mes: Message) => mes.delete(1e4))
			.catch(() => null);
	}

	private async _validateAndAdd(
		res: ResourceLoader,
		fetchMessage: Message,
		message: Message,
		queue: Queue,
		input: Video | Video[])
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
					songs.push(new Song(this.client, video, message.member));
					++success;
				}
			}

			if (!success)
			{
				return message.channel.send(res(S.CMD_PLAY_NOTHING_QUALIFIED))
					.then((m: Message) => m.delete(1e4))
					.catch(() => null);
			}

			const fullLength: number = +(queue && queue.reduce((val: number, cur: Song) => val += cur.length, 0))
				+ songs.reduce((val: number, cur: Song) => val += cur.length, 0);
			const lastSong: Song = songs[songs.length - 1];
			// tslint:disable-next-line:no-shadowed-variable that is no shadow variable <.<
			const first: boolean = await this.client.musicPlayer.add(res, message, songs);

			if (!first)
			{
				return fetchMessage.edit('',
					new RichEmbed()
						.setAuthor(lastSong.username, lastSong.avatarURL)
						.setColor(0xFFFF00)
						.setFooter(res(S.CMD_PLAY_VALIDATE_FOOTER), this.client.user.avatarURL)
						.setDescription(res(S.CMD_PLAY_VALIDATE_DESCRIPTION,
							{
								added: songs.length.toLocaleString(),
								length: Util.timeString(fullLength),
								requested: input.length.toLocaleString(),
							},
						)),
				).then(() => fetchMessage.delete(1e4))
					.catch(() => null);
			}
			return fetchMessage.delete()
				.then(() => undefined)
				.catch(() => null);
		}

		const failed: string = this._validate(input, queue);
		if (failed)
		{
			return fetchMessage.edit(res(failed), { embed: null })
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		const song: Song = new Song(this.client, input, message.member);
		const first: boolean = await this.client.musicPlayer.add(res, message, song);

		if (!first)
		{
			return fetchMessage.edit('', song.embed(SongEmbedType.ADDED))
				.then(() => fetchMessage.delete(1e4))
				.catch(() => null);
		}

		return fetchMessage.delete()
			.catch(() => null);
	}

	private _validate(video: Video, queue: Queue): string
	{
		if (queue && queue.some((song: Song) => song.id === video.id))
		{
			return S.CMD_PLAY_VALIDATE_ALREADY_QUEUED;
		}
		if (video.durationSeconds > 72e2)
		{
			return S.CMD_PLAY_VALIDATE_TOO_LONG;
		}

		return null;
	}

	private async _pick(
		res: ResourceLoader,
		message: Message,
		videos: Video[],
		statusMessage: Message,
		index: number = 0,
	): Promise<Video>
	{
		const video: Video = videos[index];

		// when nothing is left to pick automatically dismiss
		if (!video)
		{
			if (message.deletable)
			{
				message.delete().catch(() => null);
			}

			return null;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x9370DB).setTitle(video.title)
			.setImage(`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`)
			.setDescription(res(S.CMD_PLAY_PICK_DESCRIPTION,
				{
					length: video.durationSeconds ? Util.timeString(video.durationSeconds) : S.MUSIC_LIVESTREAM,
				},
			))
			.setFooter(res(S.CMD_PLAY_PICK_FOOTER,
				{
					current: (index + 1).toLocaleString(),
					total: videos.length.toLocaleString(),
				},
			),
			message.author.displayAvatarURL);

		statusMessage = statusMessage
			? await statusMessage.edit(message.author.toString(), embed).catch(() => null)
			: await message.channel.send(message.author.toString(), embed).catch(() => null);

		const response: Message = await message.channel.awaitMessages(
			(m: Message) => m.author.id === message.author.id,
			{ maxMatches: 1, time: 3e4 },
		).then((collected: Collection<Snowflake, Message>) => collected.first());
		if (response && response.deletable) response.delete().catch(() => null);

		const answer: boolean = response ? Util.resolveBoolean(response.content.split(' ')[0]) : null;
		if (answer === null)
		{
			statusMessage.delete().catch(() => null);
			return null;
		}

		if (!answer)
		{
			return this._pick(res, message, videos, statusMessage, ++index);
		}

		return video;
	}
}
