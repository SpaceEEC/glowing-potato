import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import Song from '../../structures/Song';
import { queue, song } from './play';

export default class NowPlayingCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'np',
			aliases: ['song', 'playing'],
			group: 'music',
			memberName: 'np',
			description: 'Shows the current song.',
			guildOnly: true,
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) {
			return msg.say('There is nothing going on in this guild. Add some songs!')
				.then((mes: Message) => mes.delete(5000));
		}

		const song: song = queue.songs[0];
		const currentTime: number = song.dispatcher ? song.dispatcher.time / 1000 : 0;

		return msg.embed(new RichEmbed().setColor(0x0800ff).setImage(song.thumbnail)
			.setAuthor(song.username, song.avatar)
			.setDescription(stripIndents`${queue.loop ? '**Queue is enabled!**\n' : ''}[${song.name}](${song.url})
    Currently at \`${Song.timeString(currentTime)}\`/\`${song.lengthString}\`
    ${song.playing ? '' : 'Currently paused.'}`))
			.then((mes: Message) => mes.delete(30000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play')as any).queue;

		return this._queue;
	}
};
