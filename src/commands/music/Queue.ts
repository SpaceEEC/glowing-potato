import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, desc, group, guildOnly, name, usage, using } = CommandDecorators;
const { resolve } = Middleware;

@aliases('songs', 'playlist', 'playback')
@desc('Displays the requested page of the queue, defaults to first.')
@name('queue')
@group('music')
@guildOnly
@usage('<prefix>queue [Page]')
export default class PauseCommand extends Command<Client>
{
	// tslint:disable-next-line:only-arrow-functions no-shadowed-variable
	@using(function(message: Message, args: string[]): [Message, [number]]
	{
		if (args[0]) return resolve({ '<Page>': 'Number' }).call(this, message, args);
		return [message, [1]];
	})
	@ReportError
	public async action(message: Message, [page]: [number]): Promise<void>
	{
		return this.client.musicPlayer.queue(message, page);
	}
}
