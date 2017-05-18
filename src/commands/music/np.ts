import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';
import Song from '../../structures/Song';

export default class NowPlayingCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			name: 'np',
			aliases: ['song', 'playing'],
			group: 'music',
			memberName: 'np',
			description: 'Now Playing.',
			details: 'Shows the current song.',
			guildOnly: true,
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);
		if (!queue || !queue.currentSong) {
			return msg.say('There is nothing going on in this guild. Add some songs!')
				.then((mes: Message) => mes.delete(5000));
		}

		const { currentSong, currentTime } = queue;

		return msg.embed(new RichEmbed().setColor(0x0800ff).setImage(currentSong.thumbnail)
			.setAuthor(currentSong.username, currentSong.avatar)
			.setDescription(stripIndents
				`${queue.loop ? '**Queue is enabled!**\n' : ''}[${currentSong.name}](${currentSong.url})
    			Time: \`${currentSong.timeLeft(currentTime)}\` (\`${Song.timeString(currentTime)}\`/\`${currentSong.lengthString}\`)

    			${currentSong.playing ? '' : 'Currently paused.'}`))
			.then((mes: Message) => mes.delete(30000));
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
