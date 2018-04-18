import { GuildChannel } from 'discord.js';
import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { CommandResult, ConfigCommand } from '../../structures/ConfigCommand';
import { GuildConfigChannels, GuildConfigType } from '../../types/GuildConfigKeys';

const { aliases, callerPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

const { expect } = Middleware;
@aliases('announcement-channel', 'announcementchannel')
@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the announcement channel, where messages for new and left member will be sent, if set up.')
@name('anchannel')
@group('config')
@guildOnly
@usage('<prefix>anchannel <Option> [Channel]')
export default class AnChannelCommand extends ConfigCommand<Client>
{
	@using(expect({ '<Option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.CHANNEL))
	@using(expectConfigOption(GuildConfigType.CHANNEL))
	@localizable
	@ReportError
	public async action(message: Message, [res, option, value]
		: [BetterResourceProxy, 'get' | 'set' | 'reset', GuildChannel | undefined]): Promise<CommandResult>
	{
		return this[option](message, res, GuildConfigChannels.ANCHANNEL, GuildConfigType.CHANNEL, value);
	}
}
