import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Pauses the current playback.')
@name('pause')
@group('music')
@guildOnly
@usage('<prefix>pause')
export default class PauseCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@localizable
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send(res('MUSIC_QUEUE_NON_EXISTENT'))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (!queue.dispatcher)
		{
			return message.channel.send(res('MUSIC_NO_DISPATCHER'))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (queue.dispatcher.paused)
		{
			return message.channel.send(res('CMD_PAUSE_ALREADY_PAUSED'))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		queue.dispatcher.pause();

		return message.channel
			.send(res('CMD_PAUSE_SUCCESS'))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
