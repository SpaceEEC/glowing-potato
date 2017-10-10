import { GuildChannel } from 'discord.js';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { CommandResult, ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigChannels, GuildConfigType } from '../../types/GuildConfigKeys';

const { aliases, callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect } = Middleware;

@aliases('voicelogchannel')
@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the log channel, where logs for voice movements will be sent.')
@name('vlogchannel')
@group('config')
@guildOnly
@usage('<prefix>vlogchannel <option> [...channel]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class VLogChannelCommand extends ConfigCommand<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.CHANNEL))
	@using(expectConfigOption(GuildConfigType.CHANNEL))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [ResourceLoader, 'get' | 'set' | 'reset', GuildChannel | undefined]): Promise<CommandResult>
	{
		return this[option](message, res, GuildConfigChannels.VLOGCHANNEL, GuildConfigType.CHANNEL, value);
	}
}
