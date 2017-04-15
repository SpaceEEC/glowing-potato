import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient, util } from 'discord.js-commando';
import Song from '../../structures/Song';
import { queue, song } from './play';

export default class QueueCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'queue',
			aliases: ['songs', 'playlist', 'que', 'q'],
			group: 'music',
			memberName: 'queue',
			description: 'Shows the queue.',
			examples: [
				'`queue` Shows first page.',
				'`queue` Shows first page.',
				'`queue 2` Shows second page',
				'And so on.'
			],
			guildOnly: true,
			args: [
				{
					key: 'page',
					prompt: 'which page do you like to see?\n',
					type: 'integer',
					default: 1,
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { page: number }): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.say('There is no queue, why not add some songs yourself?').then((mes: Message) => mes.delete(5000));

		if (!queue.songs[1]) return this.client.registry.resolveCommand('music:np').run(msg, {}, false);

		const pages: { page: number, items: song[], maxPage: number } = util.paginate(queue.songs, args.page, 11);

		let i: number = 0 + (args.page - 1) * 11;
		let page: string | string[] = pages.items.map((song: song) => `\`${i++}.\`[${song.name}](${song.url})`);

		const embed: RichEmbed = new RichEmbed().setColor(0x0800ff)
			.setTitle(`Queued up Songs: ${queue.songs.length} | Queue length: ${Song.timeString(queue.songs.reduce((a: number, b: song) => a + b.length, 0))}`)
			.setFooter(`Page ${args.page} of ${pages.maxPage}.`);

		if (args.page === 1) {
			const currentSong: song = queue.songs[0];
			const currentTime: number = currentSong.dispatcher ? currentSong.dispatcher.time / 1000 : 0;

			// ugly string builder start
			let pageone: string = '';
			if (queue.loop) pageone += '**Queue is enabled**\n';
			if (currentSong.playing) pageone += '**Currently playing:**\n';
			else pageone += '**Currently paused:**\n';
			pageone += `[${currentSong.name}](${currentSong.url})\n`
				+ `**Time:** ${currentSong.timeLeft(currentTime)} (${Song.timeString(currentTime)}/${currentSong.lengthString})`;
			if (page.length !== 1) pageone += `\u200b\n\n**Queue:**`;
			// ugly string builder end

			page.splice(0, 1, pageone);
			embed.setThumbnail(currentSong.thumbnail);
		} else if (queue.loop) {
			page[0] = `**Loop is enabled!**\n${page[0]}`;
		}
		if (pages.maxPage > 1) page.push(`\n\nUse ${msg.anyUsage('queue <page>')} to display a specific page`);

		page = page.join('\n');
		return msg.embed(embed.setDescription(page)
		).then((mes: Message) => mes.delete(30000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
