import { Message } from 'yamdbf/bin';
import { callerPermissions, desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { GuildConfigStrings, GuildConfigType } from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the join message, that will be send to the log and announcement channels, if set up.'
+ 'You can use `:member:` and `:guild:` as a placeholder for the left member or the guild name.'
+ 'Note: The left member won\'t be mentioned by this, their name will be displayed as `@name#discrim`.')
@name('leavemessage')
@group('config')
@guildOnly
@usage('<prefix>leavemessage <option> [...message]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class LeaveMessageCommand extends Command<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.STRING))
	@using(expectConfigOption(GuildConfigType.STRING))
	@ReportError
	public async action(message: Message, [option, value]: ['get' | 'set' | 'reset', string | undefined]): Promise<void>
	{
		return GuildConfigUtil[option](message, GuildConfigStrings.LEAVEMESSAGE, GuildConfigType.STRING, value);
	}
}
