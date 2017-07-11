import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@desc('Removes a song from the queue.')
@name('remove')
@group('music')
@guildOnly
@usage('<prefix>remove <index>')
export default class RemoveCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@using(resolve({ '<Index>': 'Number' }))
	@using(expect({ '<Index>': 'Number' }))
	@ReportError
	public async action(message: Message, [index]: [number]): Promise<void>
	{
		return this.client.musicPlayer.remove(message, index);
	}
}
