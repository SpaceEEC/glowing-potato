import { GuildChannel } from 'discord.js';
import { Message } from 'yamdbf/bin';
import {
	aliases,
	callerPermissions,
	desc,
	group,
	guildOnly,
	name,
	usage,
	using,
} from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { GuildConfigChannels, GuildConfigType } from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

@aliases('announcement-channel', 'announcementchannel')
@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the announcement channel, where messages for new and left member will be sent, if set up.')
@name('anchannel')
@group('config')
@guildOnly
@usage('<prefix>anchannel <option> [...channel]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class AnChannelCommand extends Command<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.CHANNEL))
	@using(expectConfigOption(GuildConfigType.CHANNEL))
	@ReportError
	public async action(message: Message, [option, value]: ['get' | 'set' | 'reset', GuildChannel | undefined])
		: Promise<void>
	{
		return GuildConfigUtil[option](message, GuildConfigChannels.ANCHANNEL, GuildConfigType.CHANNEL, value);
	}
}
