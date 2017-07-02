import { Collection, GuildChannel, Role, Snowflake, TextChannel, Util } from 'discord.js';
import { Message } from 'yamdbf/bin';
import { callerPermissions, desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import {
	GuildConfigChannels,
	GuildConfigRoles,
	GuildConfigStrings,
	GuildConfigType,
} from '../../types/GuildConfigKeys';
import { GuildConfigEnumUtil } from '../../util/GuildConfigEnumUtil';

const { allConfigKeys, parseConfigKey, parseConfigType } = GuildConfigEnumUtil;

@callerPermissions('MANAGE_GUILD')
@desc('Sets the channel where new or left members should be announced to, if such a message is set up.')
@name('config')
@group('administration')
@guildOnly
@usage('<prefix>config <option> <key> [...value]`\n\n'
	+ '`option` is one of `get`, `set`, `reset`.\n'
	+ `\`key\` is one of ${allConfigKeys.map((key: string) => `\`${key.toLowerCase()}\``).join(', ')}.\n`
	+ '`value` is either a channel, role or the desired text.\n')
export default class ConfigCommand extends Command<Client>
{
	// tslint:disable-next-line:only-arrow-functions
	@using(expect({ '<options>': 'String', '<key>': 'String' }))
	@using(function(message: Message, args: [string, string, string | undefined])
		: [Message, [string, string, string | undefined]]
	{
		if (!['get', 'set', 'reset'].includes(args[0].toLowerCase()))
		{
			throw new Error(`Couldn't resolve \`${args[0]}\` to a valid \`option\`.`);
		}

		if (!GuildConfigEnumUtil.parseConfigKey(args[1]))
		{
			throw new Error(`Couldn't resole \`${args[1]}\` to a valid \`key\`.`);
		}

		if (['get', 'reset'].includes(args[0].toLowerCase()))
		{
			return [message, args];
		}

		return expect({ '<option>': 'String', '<key>': 'String', '<...value>': 'Any' }).call(this, message, args);
	})
	@using(function(message: Message, args: [string, string, string | undefined])
		: [Message, [string, string, GuildChannel | Role | string | undefined]]
	{
		if (args[0].toLowerCase() === 'set')
		{
			if (GuildConfigChannels.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'Channel' }).call(this, message, args);
			}
			else if (GuildConfigRoles.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'Role' }).call(this, message, args);
			}
			else if (GuildConfigStrings.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'String' }).call(this, message, args);
			}
			throw new Error(`Couldn\'t resolve \`${args[0]}\` to a valid key, this should not happen!`);
		}
		return [message, args];
	})
	@ReportError
	public async action(message: Message, [option, key, value]
		: [string, string, GuildChannel | Role | string | undefined]): Promise<void>
	{
		option = option.toLowerCase();
		if (option === 'set')
		{
			return this._set(message, key, value);
		}
		if (option === 'get')
		{
			return this._get(message, key);
		}
		if (option === 'reset')
		{
			return this._reset(message, key);
		}
	}

	private async _set(message: Message, inputKey: string, value: GuildChannel | Role | string): Promise<void>
	{
		const key: string = parseConfigKey(inputKey);
		const keyType: GuildConfigType = parseConfigType(inputKey);

		if (keyType === GuildConfigType.CHANNEL)
		{
			if (!(value instanceof TextChannel))
			{
				return message.channel.send(`The ${inputKey} must be a text channel!`)
					.then(() => undefined);
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(`The ${inputKey} is now ${value}`)
				.then(() => undefined);
		}
		if (keyType === GuildConfigType.ROLE)
		{
			if (!(value instanceof Role))
			{
				throw new Error('The value is not a role, that should never happen!');
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(`The ${inputKey} is now \`@${value.name}\``)
				.then(() => undefined);
		}
		if (keyType === GuildConfigType.STRING)
		{
			if (typeof value !== 'string')
			{
				throw new Error('The value is not a string, that should never happen!');
			}
			await message.guild.storage.set(key, value);

			return message.channel.send(`The ${inputKey} is now \`\`\`\n${Util.escapeMarkdown(value, true)}\`\`\``)
				.then(() => undefined);
		}

	}

	private async _get(message: Message, inputKey: string): Promise<void>
	{
		const key: string = parseConfigKey(inputKey);
		const value: string = await message.guild.storage.get(key);
		if (!value)
		{
			return message.channel.send(`There is no ${inputKey} set up.`)
				.then(() => undefined);
		}

		const keyType: GuildConfigType = parseConfigType(inputKey);
		if (keyType === GuildConfigType.CHANNEL)
		{
			const channel: GuildChannel = message.guild.channels.get(value);
			if (!channel)
			{
				await message.guild.storage.remove(key);
				return message.channel.send(`The set up ${inputKey} is no longer present and has been removed from the config.`)
					.then(() => undefined);
			}

			return message.channel.send(`The current ${inputKey} is ${channel}.`)
				.then(() => undefined);
		}
		if (keyType === GuildConfigType.ROLE)
		{
			const role: Role = message.guild.roles.get(value);
			if (!role)
			{
				await message.guild.storage.remove(key);
				return message.channel
					.send(`The specified up \`${inputKey}\` is no longer present and has been removed from the config.`)
					.then(() => undefined);
			}

			return message.channel.send(`The current \`${inputKey}\` is \`@${role.name}}\``)
				.then(() => undefined);
		}
		if (keyType === GuildConfigType.STRING)
		{
			return message.channel.send(`The current \`${inputKey}\` is \`\`\`${Util.escapeMarkdown(value, true)}\`\`\``)
				.then(() => undefined);
		}
	}

	private async _reset(message: Message, key: string): Promise<void>
	{
		const prompt: Message = await message.channel.send(`Are you sure you want to reset the \`${key}\`?\n`
			+ '__y__es / __n__o\n\n'
			+ 'This prompt will be automatically canceled in \`30\` seconds.') as Message;
		const response: Message = await message.channel.awaitMessages(
			(m: Message) => m.author.id === message.author.id,
			{ maxMatches: 1, time: 3e4 },
		).then((collected: Collection<Snowflake, Message>) => collected.first());

		prompt.delete().catch(() => undefined);
		if (response && response.deletable) response.delete().then(() => undefined);

		if (!response || !['y', 'yes'].includes(response.content.toLowerCase()))
		{
			return message.channel.send('Aborting then...')
				.then(() => undefined);
		}

		await message.guild.storage.remove(parseConfigKey(key));

		return message.channel.send(`The \`${key}\` has been reset!`)
			.then(() => undefined);
	}
}
