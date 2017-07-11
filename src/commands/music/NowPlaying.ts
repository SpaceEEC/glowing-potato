import { Message } from 'yamdbf/bin';
import { aliases, desc, group, guildOnly, name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@aliases('np')
@desc('Displays the currently played song.')
@name('nowplaying')
@group('music')
@guildOnly
@usage('<prefix>nowplaying')
export default class NowPlayingCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message): Promise<void>
	{
		return this.client.musicPlayer.nowPlaying(message);
	}
}
