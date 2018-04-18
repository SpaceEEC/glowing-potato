import { Role } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceProxy } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { CommandResult, ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigRoles, GuildConfigType } from '../../types/GuildConfigKeys';

const { aliases, callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@aliases('djrole')
@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the music role, that will be able to use music commands.'
	+ 'Note: If no role is set up everyone will be able to perform music commands.')
@name('musicrole')
@group('config')
@guildOnly
@usage('<prefix>musicrole <Option> [Role]')
export default class MusicRoleCommand extends ConfigCommand<Client>
{
	@using(expect({ '<Option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.ROLE))
	@using(expectConfigOption(GuildConfigType.ROLE))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [ResourceProxy<S>, 'get' | 'set' | 'reset', Role | undefined]): Promise<CommandResult>
	{
		return this[option](message, res, GuildConfigRoles.MUSICROLE, GuildConfigType.ROLE, value);
	}
}
