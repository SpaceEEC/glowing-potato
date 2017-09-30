import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Stops the current playback.')
@name('stop')
@group('music')
@guildOnly
@usage('<prefix>stop')
export default class StopCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send(res(S.MUSIC_QUEUE_NON_EXISTENT))
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		if (!queue.dispatcher)
		{
			return message.channel
				.send(res(S.CMD_STOP_NOT_YET_POSSIBLE))
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		queue.clear();
		queue.emtpyChannel(false);
		queue.dispatcher.end('stop');

		this.client.musicPlayer.delete(message.guild.id);

		return message.channel.send(res(S.CMD_STOP_SUCCESS))
			.then((m: Message) => m.delete(5e3))
			.catch(() => null);
	}
}
