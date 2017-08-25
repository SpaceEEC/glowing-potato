import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';
import { SongEmbedType } from '../../types/SongEmbedType';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
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
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel.send(res(S.MUSIC_QUEUE_NON_EXISTENT))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		return message.channel.send(queue.currentSong.embed(SongEmbedType.NP))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
