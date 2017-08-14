import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { Queue } from '../../structures/Queue';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { resolve } = Middleware;

@desc('Sets or gets the volume of the current playback.\n'
	+ 'Command is usable by everyone when no volume is specified to get the current volume.'
	+ 'Otherwise restrictred to music role and music channel if applicable.')
@name('volume')
@group('music')
@guildOnly
@usage('<prefix>volume [volume]')
export default class VolumeCommand extends Command<Client>
{
	// tslint:disable:only-arrow-functions no-shadowed-variable
	@using(function(message: Message, [volume]: [number]): [Message, [number]]
	{
		if (volume) return musicRestricted(true).call(this, message, [volume]);

		return [message, [null]];
	})
	@using(resolve({ '<Volume>': 'Number' }))
	@localizable
	@using(function(message: Message, [res, volume]: [ResourceLoader, number]): [Message, [ResourceLoader, number]]
	{
		if (typeof volume === 'number')
		{
			if (volume > 10)
			{
				throw new Error(res(S.CMD_VOLUME_TOO_HIGH));

			}
			if (volume < 1)
			{
				throw new Error(res(S.CMD_VOLUME_TOO_LOW));
			}
		}
		return [message, [res, volume]];
	})
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable
	public async action(message: Message, [res, volume]: [ResourceLoader, number]): Promise<void>
	{
		const queue: Queue = this.client.musicPlayer.get(message.guild.id);
		const update: boolean = Boolean(volume);

		if (queue)
		{
			if (update)
			{
				queue.volume = volume;
			}
			else
			{
				volume = queue.volume;
			}

		}
		else
		{
			if (update)
			{
				await message.guild.storage.settings.set('volume', volume);
			}
			else
			{
				volume = await message.guild.storage.settings.get('volume');
			}
		}

		return message.channel.send(
			res(
				S.CMD_VOLUME_SUCCESS,
				{
					update: String(update || ''),
					volume: volume.toLocaleString(),
				},
			))
			.then((m: Message) => m.delete(1e4))
			.catch(() => null);
	}
}
