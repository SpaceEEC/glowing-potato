import { CommandDecorators, Message } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { Util } from '../../util/Util';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Sets or gets whether the playback (should) loop(s).\n'
	+ 'Command is usable by everyone to get whether the loop is enabled.'
	+ 'Otherwise restrictred to music role and music channel if applicable.')
@name('loop')
@group('music')
@guildOnly
@usage('<prefix>loop [y|n]')
export default class LoopCommand extends Command<Client>
{
	// tslint:disable:only-arrow-functions no-shadowed-variable
	@localizable
	@using(async function(message: Message, [res, input]: [BetterResourceProxy, string])
		: Promise<[Message, [BetterResourceProxy, boolean]]>
	{
		if (input && input[0])
		{
			await musicRestricted(true).call(this, message, input);
			const state: boolean = Util.resolveBoolean(input);
			if (state === null)
			{
				throw new Error(res.UTIL_RESOLVE_BOOLEAN({ input }));
			}
			return [message, [res, state]];
		}

		return [message, [res, null]];
	})
	@LogCommandRun
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable
	public async action(message: Message, [res, state]: [BetterResourceProxy, boolean]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send(res.MUSIC_QUEUE_NON_EXISTENT())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (typeof state !== 'boolean')
		{
			return message.channel.send(res.CMD_LOOP_CURRENT_STATE({ state: String(queue.loop || '') }))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		if (queue.loop === state)
		{
			return message.channel.send(res.CMD_LOOP_CURRENT_ALREADY({ state: String(state || '') }))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		queue.loop = state;

		return message.channel.send(res.CMD_LOOP_CURRENT_SET({ state: String(state || '') }))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
