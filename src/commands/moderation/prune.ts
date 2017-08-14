import { Collection, TextChannel, User } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const {
	aliases,
	callerPermissions,
	clientPermissions,
	desc,
	group,
	guildOnly,
	name,
	usage,
	using,
	localizable,
} = CommandDecorators;
const { expect, resolve } = Middleware;

@aliases('purge', 'clean', 'clear')
@clientPermissions('SEND_MESSAGES', 'MANAGE_MESSAGES')
@callerPermissions('MANAGE_MESSAGES')
@desc('Deletes the specified number of messages in a channel, optional with target filtering.')
@name('prune')
@group('moderation')
@guildOnly
@usage('<prefix>prune <Count> [Target]')
export default class PruneCommand extends Command<Client>
{
	@using(function(msg: Message, args: string[]): Promise<[Message, any[]]>
	{
		if (args[1])
		{
			return resolve({
				'<Count>': 'Number',
				'<Target>': 'User',
			}).call(this, msg, args);
		}
		return resolve({ '<Count>': 'Number' }).call(this, msg, args);
	})
	@using(function(msg: Message, args: string[]): Promise<[Message, any[]]>
	{
		if (args[1])
		{
			return expect({
				'<Count>': 'Number',
				'<Target>': 'User',
			}).call(this, msg, args);
		}
		return expect({ '<Count>': 'Number' }).call(this, msg, args);
	})
	@localizable
	@ReportError
	public async action(message: Message, [res, count, user]: [ResourceLoader, number, User]): Promise<void>
	{
		// for tslint and typescript
		if (!(message.channel instanceof TextChannel))
		{
			// because you can not receive a message from a voice channel, and this command is guild only
			throw new Error('This channel is not a text channel, this should never happen.');
		}

		if (count > 100 || count < 1)
		{
			return message.channel.send(res(S.CMD_PRUNE_INVALID_COUNT))
				.then(() => undefined);
		}

		let messages: Collection<string, Message> = await message.channel.fetchMessages({ limit: count });
		if (user) messages = messages.filter((m: Message) => m.author.id === user.id);
		if (!messages.size) return undefined;

		if (messages.size === 1) return messages.first().delete().then(() => undefined);
		return message.channel.bulkDelete(messages, true).then(() => undefined);
	}
}
