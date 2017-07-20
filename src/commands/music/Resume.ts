import { CommandDecorators, Message } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;

@desc('Resumes the current playback in this guild.')
@name('resume')
@group('music')
@guildOnly
@usage('<prefix>resume')
export default class ResumeCommand extends Command<Client>
{
	@using(musicRestricted(true))
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.setPlaying(message, true);
	}
}
