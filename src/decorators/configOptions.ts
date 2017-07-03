import { GuildChannel, Role } from 'discord.js';
import { ExpectArgType, Message, ResolveArgType } from 'yamdbf/bin';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { GuildConfigType } from '../types/GuildConfigKeys';

export function expectConfigOption(type: GuildConfigType)
	: (message: Message, args: string[]) => [Message, [string, GuildChannel | Role | string | undefined]]
{
	const [name, argType] = resolveArgType(type) as [string, ExpectArgType];
	return function(message: Message, args: string[]): [Message, [string, GuildChannel | Role | string | undefined]]
	{
		args[0] = args[0].toLowerCase();
		if (!['get', 'set', 'reset'].includes(args[0]))
		{
			throw new Error(`Couldn't resolve \`${args[0]}\` to a valid \`option\`.`);
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
		return [message, [args[0] as any, undefined]];
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
