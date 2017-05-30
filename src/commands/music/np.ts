import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';
import Song from '../../structures/Song';

export default class NowPlayingCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['song', 'playing'],
			description: 'Now Playing.',
			details: 'Shows the current song.',
			group: 'music',
			guildOnly: true,
			memberName: 'np',
			name: 'np',
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);
		if (!queue || !queue.currentSong) {
			return msg.say('There is nothing going on in this guild. Add some songs!')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}

		const { currentSong, currentTime } = queue;

		return msg.embed(new RichEmbed().setColor(0x0800ff).setImage(currentSong.thumbnail)
			.setAuthor(currentSong.username, currentSong.avatar)
			.setDescription(stripIndents
				// tslint:disable-next-line:max-line-length
				`${queue.loop ? '**Queue is enabled!**\n' : ''}[${currentSong.name}](${currentSong.url})
				Time: \`${currentSong.timeLeft(currentTime)}\` (\`${Song.timeString(currentTime)}\`/\`${currentSong.lengthString}\`)

				${currentSong.playing ? '' : 'Currently paused.'}`))
			.then((mes: Message) => void mes.delete(30000))
			.catch(() => undefined);
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
