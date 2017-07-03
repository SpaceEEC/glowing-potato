import { GuildStorage, Message, Util } from 'yamdbf/bin';
import { aliases, callerPermissions, desc, group, guildOnly, name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { GuildConfigUtil } from '../../util/GuildConfigUtil';

@aliases('config-overview', 'show-config', 'showconfig')
@callerPermissions('MANAGE_GUILD')
@desc('Displays an overview of the configuration for this server.')
@name('configoverview')
@group('config')
@guildOnly
@usage('<prefix>configoverview')
export default class ConfigOverviewCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message): Promise<void>
	{
		const values: [string, boolean][] = await this._fetchAllValues(message.guild.storage);

		let length: number = 0;
		for (const [key] of values) if (length < key.length) length = key.length;

		let response: string = 'Overview of whether config options are set up:\n```ldif\n';
		for (const [key, set] of values)
		{
			response += `${Util.padRight(key, length + 1)}: ${set ? '✅' : '❌'}\n`;
		}
		response += '\n```';

		return message.channel.send(response)
			.then(() => undefined);
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
