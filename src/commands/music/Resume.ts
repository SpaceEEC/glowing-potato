import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Resumes the current playback in this guild.')
@name('resume')
@group('music')
@guildOnly
@usage('<prefix>resume')
export default class ResumeCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send(res(S.MUSIC_QUEUE_NON_EXISTENT))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (!queue.dispatcher)
		{
			return message.channel.send(res(S.MUSIC_NO_DISPATCHER))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (!queue.dispatcher.paused)
		{
			return message.channel.send(res(S.CMD_RESUME_ALREADY_RUNNING))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		queue.dispatcher.resume();

		return message.channel
			.send(res(S.CMD_RESUME_SUCCESS))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
