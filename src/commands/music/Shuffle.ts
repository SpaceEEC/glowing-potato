import { CommandDecorators, Message } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage, using } = CommandDecorators;

@desc('Shuffles the current queue.')
@name('shuffle')
@group('music')
@guildOnly
@usage('<prefix>shuffle')
export default class ShuffleCommaand extends Command<Client>
{
	@using(musicRestricted(true))
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.shuffle(message);
	}
}
