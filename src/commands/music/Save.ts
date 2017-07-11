import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

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
