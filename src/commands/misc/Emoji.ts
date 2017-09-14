import { Emoji } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@aliases('e')
@clientPermissions('SEND_MESSAGES', 'EXTERNAL_EMOJIS')
@desc('Sends the requested emoji to the channel.')
@name('emoji')
@group('misc')
@guildOnly
@usage('<prefix>emoji <Emoji> [Message]')
export default class EmojiCommand extends Command<Client>
{
	// tslint:disable:only-arrow-functions no-shadowed-variable
	@using(expect({ '<Emoji>': 'String' }))
	@localizable
	@using(async function(
		this: EmojiCommand,
		message: Message,
		[res, inputEmoji, inputMessage]: [ResourceLoader, string, string],
	): Promise<[Message, [Emoji, Message]]>
	{
		const emoji: Emoji = this.client.emojis.get(inputEmoji)
			|| this.client.emojis.find('name', inputEmoji)
			|| this.client.emojis.find((e: Emoji) => e.name.toUpperCase() === inputEmoji.toUpperCase());
		if (!emoji) throw new Error(res(S.CMD_EMOJI_COULD_NOT_RESOLVE_EMOJI, { input: inputEmoji }));

		let fetched: Message = null;
		if (inputMessage)
		{
			if (isNaN(Number(inputMessage)))
			{
				throw new Error(res(S.CMD_EMOJI_COULD_NOT_RESOLVE_MESSAGE));
			}

			try
			{
				fetched = await message.channel.fetchMessage(inputMessage);
			}
			catch (error)
			{
				if (error.code === 10008)
				{
					throw new Error(res(S.CMD_EMOJI_COULD_NOT_RESOLVE_MESSAGE));
				}

				throw error;
			}
		}

		return [message, [emoji, fetched]];
	})
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable
	public async action(message: Message, [emoji, target]: [Emoji, Message]): Promise<void>
	{
		if (message.deletable) message.delete().catch(() => null);

		if (target)
		{
			return target.react(emoji)
				.then(() => undefined);
		}
		return message.channel.send(emoji.toString())
			.then(() => undefined);
	}
}
