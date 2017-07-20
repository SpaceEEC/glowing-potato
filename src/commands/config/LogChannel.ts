import { GuildChannel } from 'discord.js';
import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { GuildConfigChannels, GuildConfigType } from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

const { callerPermissions, desc, group, guildOnly, name, usage, using } = CommandDecorators;
const { expect } = Middleware;

@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the log channel, where messages for new and left member will be sent, if set up.')
@name('logchannel')
@group('config')
@guildOnly
@usage('<prefix>logchannel <option> [...channel]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class LogChannelCommand extends Command<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.CHANNEL))
	@using(expectConfigOption(GuildConfigType.CHANNEL))
	@ReportError
	public async action(message: Message, [option, value]: ['get' | 'set' | 'reset', GuildChannel | undefined])
		: Promise<void>
	{
		return GuildConfigUtil[option](message, GuildConfigChannels.LOGCHANNEL, GuildConfigType.CHANNEL, value);
	}
}
