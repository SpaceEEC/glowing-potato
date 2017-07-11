import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Util } from '../../util/Util';

@desc('Sets or gets whether the playback (should) loop(s).\n'
	+ 'Command is usable by everyone to get whether the loop is enabled.'
	+ 'Otherwise restrictred to music role and music channel if applicable.')
@name('loop')
@group('music')
@guildOnly
@usage('<prefix>loop [y/n]')
export default class LoopCommand extends Command<Client>
{
	// tslint:disable-next-line:only-arrow-functions no-shadowed-variable
	@using(function(message: Message, args: string[]): [Message, string[]]
	{
		if (args[0]) return musicRestricted(true).call(this, message, args);

		return [message, args];
	})
	@ReportError
	public async action(message: Message, [input]: [string]): Promise<void>
	{
		const state: boolean = Util.resolveBoolean(input);
		if (input && state === null)
		{
			return message.channel.send(
				`Couldn\'t resolve ${input} to a boolean.`
				+ 'Use `y` or `n`, for example.',
			)
				.then(() => undefined)
				.catch(() => null);
		}

		return this.client.musicPlayer.loop(message, state);
	}
}
