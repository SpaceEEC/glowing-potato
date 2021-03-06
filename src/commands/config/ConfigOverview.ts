import { CommandDecorators, GuildStorage, Message, Util } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

const { aliases, callerPermissions, desc, group, guildOnly, name, usage, localizable } = CommandDecorators;

@aliases('config-overview', 'show-config', 'showconfig')
@callerPermissions('MANAGE_GUILD')
@desc('Displays an overview of the configuration for this server.')
@name('configoverview')
@group('config')
@guildOnly
@usage('<prefix>configoverview')
export default class ConfigOverviewCommand extends Command<Client>
{
	@localizable
	@ReportError
	public async action(message: Message, [res]: [BetterResourceProxy]): Promise<CommandResult>
	{
		const values: [string, boolean][] = await this._fetchAllValues(message.guild.storage);

		let length: number = 0;
		for (const [key] of values) if (length < key.length) length = key.length;

		let response: string = `${res.CMD_CONFIGOVERVIEW_EXPLANATION()}\n\`\`\`ldif\n`;
		for (const [key, set] of values)
		{
			response += `${Util.padRight(key, length + 1)}: ${set ? '✅' : '❌'}\n`;
		}
		response += '\n```';

		return response;
	}

	private _fetchAllValues(storage: GuildStorage): Promise<[string, boolean][]>
	{
		const values: [string, boolean][] = [];
		const promises: Promise<boolean>[] = [];

		for (const [i, key] of GuildConfigUtil.allConfigValues.entries())
		{
			values[i] = [] as [string, boolean];
			values[i][0] = key;
			promises.push(storage.get(key).then((value: string) => values[i][1] = Boolean(value)));
		}

		return Promise.all(promises).then(() => values);
	}
}
