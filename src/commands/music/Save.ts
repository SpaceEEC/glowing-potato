import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, guildOnly, name, usage } = CommandDecorators;

@desc('"Saves" the current song into your DMs.')
@name('save')
@group('music')
@guildOnly
@usage('<prefix>save')
export default class SaveCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.save(message);
	}
}
