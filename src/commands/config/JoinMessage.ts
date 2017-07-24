import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigStrings, GuildConfigType } from '../../types/GuildConfigKeys';

const { callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the join message, that will be send to the log and announcement channels, if set up.'
	+ 'You can use `:member:` and `:guild:` as a placeholder for the new member or the guild name.'
	+ 'Note: The new member won\'t be mentioned by this, their name will be displayed as `@name#discrim`.')
@name('joinmessage')
@group('config')
@guildOnly
@usage('<prefix>joinmessage <Option> [...message]')
export default class JoinMessageCommand extends ConfigCommand<Client>
{
	@using(expect({ '<Option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.STRING))
	@using(expectConfigOption(GuildConfigType.STRING))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [ResourceLoader, 'get' | 'set' | 'reset', string | undefined]): Promise<void>
	{
		return this[option](message, res, GuildConfigStrings.JOINMESSAGE, GuildConfigType.STRING, value);
	}
}
