import { CommandDecorators, Message } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;

@desc('Pauses the current playback.')
@name('pause')
@group('music')
@guildOnly
@usage('<prefix>pause')
export default class PauseCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.setPlaying(message, false);
	}
}
