import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, desc, group, guildOnly, name, usage } = CommandDecorators;

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
