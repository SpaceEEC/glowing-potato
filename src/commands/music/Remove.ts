import { CommandDecorators, Message, Middleware } from 'yamdbf';
import { Queue } from '../../structures/Queue';
import { Song } from '../../structures/Song';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect, resolve } = Middleware;

@desc('Removes a song from the queue.')
@name('remove')
@group('music')
@guildOnly
@usage('<prefix>remove <Index>')
export default class RemoveCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@using(resolve({ '<Index>': 'Number' }))
	@using(expect({ '<Index>': 'Number' }))
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res, index]: [BetterResourceProxy, number]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send(res.MUSIC_QUEUE_NON_EXISTENT())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (index === 0) return this.client.commands.get('skip').action(message, []);

		if (!queue.at(index))
		{
			return message.channel.send(res.CMD_REMOVE_NOT_FOUND())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		const [removed]: Song[] = queue.removeAt(index);

		return message.channel.send(res.CMD_REMOVE_SUCCESS(
			{
				position: index.toLocaleString(),
				removed: removed.toString(),
			},
		)).then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
