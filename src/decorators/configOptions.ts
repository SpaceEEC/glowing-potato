import { GuildChannel, Role } from 'discord.js';
import { ExpectArgType, Lang, Message, Middleware, ResolveArgType, ResourceLoader } from 'yamdbf';

import { Client } from '../structures/Client';
import { ConfigCommand } from '../structures/ConfigCommand';
import { GuildConfigType } from '../types/GuildConfigKeys';

const { expect, resolve } = Middleware;

export function expectConfigOption(type: GuildConfigType)
	: (message: Message, args: string[]) => Promise<[Message, [string, GuildChannel | Role | string | undefined]]>
{
	const [name, argType] = resolveArgType(type) as [string, ExpectArgType];
	return async function(this: ConfigCommand<Client>, message: Message, args: string[]):
		Promise<[Message, [string, GuildChannel | Role | string | undefined]]>
	{
		const res: ResourceLoader = Lang.createResourceLoader(
			await message.guild.storage.settings.get('lang')
			|| this.client.defaultLang,
		);
		args[0] = args[0].toLowerCase();
		if (!['get', 'set', 'reset'].includes(args[0]))
		{
			throw new Error(res(
				'EXPECT_ERR_INVALID_OPTION',
				{
					arg: args[0],
					name: '<Option>',
					type: '`get`, `set` and `reset`',
					usage: this.usage,
				}),
			);
		}
		if (args[0] === 'set')
		{
			return expect({ '<option>': 'String', [name]: argType }).call(this, message, args);
		}
		return [message, [args[0], undefined]];
	};
}

export function resolveConfigOption(type: GuildConfigType)
	: (message: Message, args: string[]) => [Message, [string, GuildChannel | Role | string | undefined]]
{
	const [name, argType] = resolveArgType(type) as [string, ResolveArgType];
	return function(message: Message, args: string[]): [Message, [string, GuildChannel | Role | string | undefined]]
	{
		if (args[0] === 'set')
		{
			return resolve({ '<option>': 'String', [name]: argType }).call(this, message, args);
		}
		return [message, [args[0], undefined]];
	};
}

function resolveArgType(type: GuildConfigType): [string, ExpectArgType | ResolveArgType]
{
	switch (type)
	{
		case GuildConfigType.CHANNEL:
			return ['<...channel>', 'Channel'];
		case GuildConfigType.ROLE:
			return ['<...role>', 'Role'];
		case GuildConfigType.STRING:
			return ['<...message>', 'String'];
	}
}
