import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { CommandResult, ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigStrings, GuildConfigType } from '../../types/GuildConfigKeys';

const { callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the join message, that will be send to the log and announcement channels, if set up.'
	+ 'You can use `:member:`, `:mention`, and `:guild:` as a placeholder for the new member, their mention, and the '
	+ 'guild name. Note that `member` won\'t mention the member and just display `@name#discrim`. To get an actual '
	+ 'mention use `:mention:`.')
@name('leavemessage')
@group('config')
@guildOnly
@usage('<prefix>leavemessage <Option> [...Message]')
export default class LeaveMessageCommand extends ConfigCommand<Client>
{
	@using(expect({ '<Option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.STRING))
	@using(expectConfigOption(GuildConfigType.STRING))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [BetterResourceProxy, 'get' | 'set' | 'reset', string | undefined]): Promise<CommandResult>
	{
		return this[option](message, res, GuildConfigStrings.LEAVEMESSAGE, GuildConfigType.STRING, value);
	}
}
