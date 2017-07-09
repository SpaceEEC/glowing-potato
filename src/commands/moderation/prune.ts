import { Collection, GuildMember, TextChannel } from 'discord.js';
import { Message } from 'yamdbf/bin';
import {
	aliases,
	callerPermissions,
	clientPermissions,
	desc,
	group,
	guildOnly,
	name,
	usage,
	using,
} from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@aliases('purge', 'clean', 'clear')
@clientPermissions('SEND_MESSAGES', 'MANAGE_MESSAGES')
@callerPermissions('MANAGE_MESSAGES')
@desc('Deletes the specified number of messages in a channel, optional with target filtering.')
@name('prune')
@group('moderation')
@guildOnly
@usage('<prefix>prune <count> [target]')
export default class PruneCommand extends Command<Client>
{
	@using(function(message: Message, args: string[]): Promise<[Message, any[]]>
	{
		if (args[1]) return resolve({ '<count>': 'Number', '<target>': 'Member' }).call(this, message, args);
		return resolve({ '<count>': 'Number' }).call(this, message, args);
	})
	@using(function(message: Message, args: string[]): Promise<[Message, any[]]>
	{
		if (args[1]) return expect({ '<count>': 'Number', '<target>': 'Member' }).call(this, message, args);
		return expect({ '<count>': 'Number' }).call(this, message, args);
	})
	@ReportError
	public async action(message: Message, [count, member]: [number, GuildMember]): Promise<void>
	{
		// for tslint and typescript
		if (!(message.channel instanceof TextChannel)) throw new Error('This should never happen.');

		let messages: Collection<string, Message> = await message.channel.fetchMessages({ limit: count });
		if (member) messages = messages.filter((m: Message) => m.author.id === member.id);
		if (!messages.size) return undefined;

		if (messages.size === 1) return messages.first().delete().then(() => undefined);
		return message.channel.bulkDelete(messages, true).then(() => undefined);
	}
}
