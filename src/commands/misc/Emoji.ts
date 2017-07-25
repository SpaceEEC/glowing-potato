import { Emoji } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
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
@usage('<prefix>emoji <Emoji>')
export default class EmojiCommand extends Command<Client>
{
	// tslint:disable:only-arrow-functions no-shadowed-variable
	@using(expect({ '<Emoji>': 'String' }))
	@localizable
	@using(function(
		this: EmojiCommand,
		message: Message,
		[res, input]: [ResourceLoader, string],
	): [Message, [ResourceLoader, Emoji]]
	{
		let emoji: Emoji = this.client.emojis.get(input)
			|| this.client.emojis.find('name', input)
			|| this.client.emojis.find((e: Emoji) => e.name.toUpperCase() === input.toUpperCase());
		if (!emoji) throw new Error(res('CMD_EMOJI_COULD_NOT_RESOLVE', { input }));

		return [message, [res, emoji]];
	})
	@ReportError
	// tslint:enable:only-arrow-functions no-shadowed-variable
	public async action(message: Message, [res, emoji]: [ResourceLoader, Emoji]): Promise<void>
	{
		return message.channel.send(emoji.toString())
			.then(() => undefined);
	}
}
