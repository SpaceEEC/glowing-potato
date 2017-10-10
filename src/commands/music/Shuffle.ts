import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Shuffles the current queue.')
@name('shuffle')
@group('music')
@guildOnly
@usage('<prefix>shuffle')
export default class ShuffleCommaand extends Command<Client>
{
	@using(musicRestricted(true))
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue || queue.length < 3)
		{
			return message.channel.send(res(S.CMD_SHUFFLE_QUEUE_EMPTY_OR_TOO_SMALL))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		queue.shuffle();

		return message.channel.send(res(S.CMD_SHUFFLE_SUCCESS))
			.then((m: Message) => m.delete(10e4))
			.catch(() => null);
	}
}
