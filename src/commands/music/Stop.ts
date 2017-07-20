import { CommandDecorators, Message } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;

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
