import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@desc('Stops the current playback.')
@name('stop')
@group('music')
@guildOnly
@usage('<prefix>stop')
export default class StopCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.stop(message);
	}
}
