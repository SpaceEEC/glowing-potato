import { Role } from 'discord.js';
import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { expectConfigOption, resolveConfigOption } from '../../decorators/configOptions';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { GuildConfigRoles, GuildConfigType } from '../../types/GuildConfigKeys';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

const { aliases, callerPermissions, desc, group, guildOnly, name, usage, using } = CommandDecorators;
const { expect } = Middleware;

@aliases('djrole')
@callerPermissions('MANAGE_GUILD')
@desc('Sets, gets or resets the music role, that will be able to use music commands.'
	+ 'Note: If no role is set up everyone will be able to perform music commands.')
@name('musicrole')
@group('config')
@guildOnly
@usage('<prefix>musicrole <option> [...role]`\n\n'
	+ '`option` is one of `get`, `set`, `reset')
export default class MusicRoleCommand extends Command<Client>
{
	@using(expect({ '<option>': 'String' }))
	@using(resolveConfigOption(GuildConfigType.ROLE))
	@using(expectConfigOption(GuildConfigType.ROLE))
	@ReportError
	public async action(message: Message, [option, value]: ['get' | 'set' | 'reset', Role | undefined]): Promise<void>
	{
		return GuildConfigUtil[option](message, GuildConfigRoles.MUSICROLE, GuildConfigType.ROLE, value);
	}
}
