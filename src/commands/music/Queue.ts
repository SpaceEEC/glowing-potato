import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RichEmbed } from '../../structures/RichEmbed';
import { Song } from '../../structures/Song';
import { PaginatedPage } from '../../types/PaginatedPage';
import { Util } from '../../util/Util';

const { aliases, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { resolve } = Middleware;

@aliases('songs', 'playlist', 'playback')
@desc('Displays the requested page of the queue, defaults to first.')
@name('queue')
@group('music')
@guildOnly
@usage('<prefix>queue [Page]')
export default class QueueCommand extends Command<Client>
{
	// tslint:disable-next-line:only-arrow-functions no-shadowed-variable
	@using(function(message: Message, args: string[]): [Message, [number]]
	{
		if (args[0]) return resolve({ '<Page>': 'Number' }).call(this, message, args);
		return [message, [1]];
	})
	@localizable
	@ReportError
	public async action(message: Message, [res, page]: [ResourceLoader, number]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue || !queue.length)
		{
			return message.channel
				.send(res(S.MUSIC_QUEUE_NON_EXISTENT))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (queue.length === 1) return this.client.commands.get('nowPlaying').action(message, []);

		const { items, maxPage }: PaginatedPage<Song> = queue.page(page);
		const queueLength: string = Util.timeString(queue.reduce((p: number, c: Song) => p += c.length, 0));

		let i: number = (page - 1) * 11;
		const currentPage: string[] = [];
		for (const song of items)
		{
			currentPage.push(`\`${i++}.\` ${song.lengthString} - [${song.name}](${song.url})`);
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setTitle(
			res(S.CMD_QUEUE_EMBED_TITLE,
				{
					queueLength,
					songs: queue.length.toLocaleString(),
				},
			))
			.setFooter(
			res(S.CMD_QUEUE_EMBED_FOOTER,
				{
					maxPage: maxPage.toLocaleString(),
					page: page.toLocaleString(),
				},
			));

		if (page === 1)
		{
			const { currentSong, dispatcher, playing, loop } = queue;
			const currentTime: number = dispatcher ? dispatcher.time / 1000 : 0;

			// ugly string builder start
			let pageOne: string = '';
			if (loop) pageOne += res(S.CMD_QUEUE_LOOP_ENABLED);
			if (playing) pageOne += res(S.CMD_QUEUE_CUURENTLY_PLAYING);
			else pageOne += res(S.CMD_QUEUE_CURRENTLY_PAUSED);
			pageOne += res(S.CMD_QUEUE_CURRENT_TIME,
				{
					current: Util.timeString(currentTime),
					left: currentSong.timeLeft(currentTime),
					length: currentSong.lengthString,
					name: currentSong.name,
					url: currentSong.url,
				},
			);
			if (currentPage.length !== 1)
			{
				pageOne += '\u200b\n\n';
				pageOne += res(S.CMD_QUEUE_QUEUE);
			}
			// ugly string builder end

			currentPage.splice(0, 1, pageOne);
			embed.setThumbnail(currentSong.thumbnailURL);
		}
		else if (queue.loop)
		{
			currentPage[0] = res(S.CMD_QUEUE_LOOP_ENABLED, { page: currentPage[0] });
		}

		embed.setDescription(currentPage);

		return message.channel.send({ embed })
			.then((m: Message) => m.delete(3e4))
			.catch(() => null);
	}
}
