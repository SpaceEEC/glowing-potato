import { CommandDecorators, Message, ResourceProxy } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RichEmbed } from '../../structures/RichEmbed';
import { SongEmbedType } from '../../types/SongEmbedType';

const { desc, group, guildOnly, name, usage, localizable } = CommandDecorators;

@desc('"Saves" the current song into your DMs.')
@name('save')
@group('music')
@guildOnly
@usage('<prefix>save')
export default class SaveCommand extends Command<Client>
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
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const embed: RichEmbed = queue.currentSong.embed(SongEmbedType.SAVE);
		embed.author = null;

		return message.author.send(embed)
			.then(() => undefined)
			.catch(() =>
				message.channel.send(res.CMD_SAVE_DM_FAILED()),
		);
	}
}
