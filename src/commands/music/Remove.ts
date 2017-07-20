import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;
const { expect, resolve } = Middleware;

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
