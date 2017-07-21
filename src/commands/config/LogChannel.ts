import { GuildChannel } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigChannels, GuildConfigType } from '../../types/GuildConfigKeys';

const { callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the log channel, where messages for new and left member will be sent, if set up.')
@name('logchannel')
@group('config')
@guildOnly
@usage('<prefix>logchannel <option> [...channel]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class LogChannelCommand extends ConfigCommand<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.CHANNEL))
	@using(expectConfigOption(GuildConfigType.CHANNEL))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [ResourceLoader, 'get' | 'set' | 'reset', GuildChannel | undefined]): Promise<void>
	{
		return this[option](message, res, GuildConfigChannels.LOGCHANNEL, GuildConfigType.CHANNEL, value);
	}
}
