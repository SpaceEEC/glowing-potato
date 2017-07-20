import { CommandDecorators, Message } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;

@desc('Skips the current song.')
@name('skip')
@group('music')
@guildOnly
@usage('<prefix>skip')
export default class SkipCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.skip(message);
	}
}
