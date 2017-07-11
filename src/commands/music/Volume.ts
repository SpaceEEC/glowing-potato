import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@desc('Sets or gets the volume of the current playback.\n'
+ 'Command is usable by everyone when no volume is specified to get the current volume.'
+ 'Otherwise restrictred to music role and music channel if applicable.')
@name('volume')
@group('music')
@guildOnly
@usage('<prefix>volume [volume]')
export default class VolumeCommand extends Command<Client>
{
	// tslint:disable-next-line:only-arrow-functions
	// tslint:disable-next-line:no-shadowed-variable
	@using(function(message: Message, args: string[]): [Message, string[]]
	{
		if (args[0]) return musicRestricted(true).call(this, message, args);

		return [message, args];
	})
	@using(resolve({ '<Volume>': 'Number' }))
	@ReportError
	public async action(message: Message, [volume]: [number]): Promise<void>
	{
		if (typeof volume === 'number')
		{
			if (volume > 10)
			{
				return message.channel.send('The volume may not be higher than `10`.')
					.then((m: Message) => m.delete(5e3))
					.catch(() => null);
			}
			if (volume < 1)
			{
				return message.channel.send('The volume may not be lower than `1`.')
					.then((m: Message) => m.delete(5e3))
					.catch(() => null);
			}
		}

		return this.client.musicPlayer.volume(message, volume);
	}
}
