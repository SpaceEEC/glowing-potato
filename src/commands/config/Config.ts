import { GuildChannel, Role } from 'discord.js';
import { CommandDecorators, Lang, Message, Middleware } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { CommandResult, ConfigCommand as ConfigCommandBase } from '../../structures/ConfigCommand';
import { GuildConfigChannels, GuildConfigRoles, GuildConfigStrings } from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

const { callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect, resolve } = Middleware;

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets config entries.')
@name('config')
@group('config')
@guildOnly
@usage('<prefix>config <Option> <Key> [...Value]')
export default class ConfigCommand extends ConfigCommandBase<Client>
{
	// tslint:disable:no-shadowed-variable object-literal-sort-keys
	@using(expect({
		'<Options>': 'String',
		'<Key>': 'String',
	}))
	@using(async function(message: Message, args: [string, string, string | undefined])
		: Promise<[Message, [string, string, string | undefined]]>
	{
		const res: BetterResourceProxy = Lang.createResourceProxy(
			await message.guild.storage.settings.get('lang')
			|| this.client.defaultLang,
		) as BetterResourceProxy;

		args[0] = args[0].toLowerCase();
		if (!['get', 'set', 'reset'].includes(args[0]))
		{
			throw new Error(res.EXPECT_ERR_INVALID_OPTION(
				{
					arg: args[0],
					name: '<Option>',
					type: '`get`, `set` and `reset`',
					usage: this.usage,
				}),
			);
		}

		if (!GuildConfigUtil.parseConfigKey(args[1]))
		{
			throw new Error(res.EXPECT_ERR_INVALID_OPTION(
				{
					arg: args[0],
					name: '<Option>',
					type: GuildConfigUtil.allConfigKeys.map((key: string) => `\`${key.toLowerCase()}\``).join(', '),
					usage: this.usage,
				}),
			);
		}

		if (['get', 'reset'].includes(args[0]))
		{
			return [message, args];
		}

		return expect({
			'<Option>': 'String',
			'<Key>': 'String',
			'<...Value>': 'Any',
		}).call(this, message, args);
	})
	@using(function(msg: Message, args: [string, string, string | undefined])
		: [Message, [string, string, GuildChannel | Role | string | undefined]]
	{
		if (args[0] === 'set')
		{
			if (GuildConfigChannels.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({
					'<Option>': 'String',
					'<Key>': 'String',
					'<...Value>': 'Channel',
				}).call(this, msg, args);
			}
			else if (GuildConfigRoles.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({
					'<Option>': 'String',
					'<Key>': 'String',
					'<...Value>': 'Role',
				}).call(this, msg, args);
			}
			else if (GuildConfigStrings.hasOwnProperty(args[1].toUpperCase()))
			{
				return resolve({
					'<Option>': 'String',
					'<Key>': 'String',
					'<...Value>': 'String',
				}).call(this, msg, args);
			}

			throw new Error(`Couldn\'t resolve \`${args[0]}\` to a valid key.\n\nNote: This should never happen!`);
		}
		return [msg, args];
	})
	@localizable
	@ReportError
	// tslint:enable:no-shadowed-variable object-literal-sort-keys
	public async action(message: Message, [res, option, key, value]
		: [BetterResourceProxy, 'get' | 'set' | 'reset', string, GuildChannel | Role | string | undefined],
	): Promise<CommandResult>
	{
		return this[option](message,
			res,
			GuildConfigUtil.parseConfigKey(key),
			GuildConfigUtil.parseConfigType(key),
			value,
		);
	}
}
