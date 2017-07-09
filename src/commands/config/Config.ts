import { GuildChannel, Role } from 'discord.js';
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
} from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets config entries.')
@name('config')
@group('config')
@guildOnly
@usage('<prefix>config <option> <key> [...value]`\n\n'
	+ '`option` is one of `get`, `set`, `reset`.\n'
	+ `\`key\` is one of ${GuildConfigUtil.allConfigKeys.map((key: string) => `\`${key.toLowerCase()}\``).join(', ')}.\n`
	+ '`value` is either a channel, role or the desired text. Only available when using the option `set')
export default class ConfigCommand extends Command<Client>
{
	@using(expect({ '<options>': 'String', '<key>': 'String' }))
	@using(function(msg: Message, args: [string, string, string | undefined])
		: [Message, [string, string, string | undefined]]
	{
		args[0] = args[0].toLowerCase();
		if (!['get', 'set', 'reset'].includes(args[0]))
		{
			throw new Error(`Couldn't resolve \`${args[0]}\` to a valid \`option\`.`);
		}

		if (!GuildConfigUtil.parseConfigKey(args[1]))
		{
			throw new Error(`Couldn't resole \`${args[1]}\` to a valid \`key\`.`);
		}

		if (['get', 'reset'].includes(args[0]))
		{
			return [msg, args];
		}

		return expect({ '<option>': 'String', '<key>': 'String', '<...value>': 'Any' }).call(this, msg, args);
	})
	@using(function(msg: Message, args: [string, string, string | undefined])
		: [Message, [string, string, GuildChannel | Role | string | undefined]]
	{
		if (args[0] === 'set')
		{
			if (GuildConfigChannels.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'Channel' }).call(this, msg, args);
			}
			else if (GuildConfigRoles.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'Role' }).call(this, msg, args);
			}
			else if (GuildConfigStrings.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({ '<option>': 'String', '<key>': 'String', '<...value>': 'String' }).call(this, msg, args);
			}
			throw new Error(`Couldn\'t resolve \`${args[0]}\` to a valid key.\n\nNote: This should never happen!`);
		}
		return [msg, args];
	})
	@ReportError
	public async action(message: Message, [option, key, value]
		: ['get' | 'set' | 'reset', string, GuildChannel | Role | string | undefined]): Promise<void>
	{
		return GuildConfigUtil[option](message,
			GuildConfigUtil.parseConfigKey(key),
			GuildConfigUtil.parseConfigType(key),
			value,
		);
	}
}
