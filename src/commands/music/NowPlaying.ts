import { CommandDecorators, Message, ResourceProxy } from 'yamdbf';
import { SongEmbedType } from '../../types/SongEmbedType';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { aliases, desc, group, guildOnly, name, usage, localizable } = CommandDecorators;

@aliases('np')
@desc('Displays the currently played song.')
@name('nowPlaying')
@group('music')
@guildOnly
@usage('<prefix>nowplaying')
export default class NowPlayingCommand extends Command<Client>
{
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res]: [ResourceProxy<S>]): Promise<CommandResult>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send(res.MUSIC_QUEUE_NON_EXISTENT())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		return message.channel.send(queue.currentSong.embed(SongEmbedType.NP))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
