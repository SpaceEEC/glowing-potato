import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';
import { SongEmbedType } from '../../types/SongEmbedType';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RichEmbed } from '../../structures/RichEmbed';

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
			return message.channel.send(res('MUSIC_QUEUE_NON_EXISTENT'))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		const embed: RichEmbed = queue.currentSong.embed(SongEmbedType.NP);

		return message.channel.send({ embed })
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
