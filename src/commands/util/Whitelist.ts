import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, desc, name, usage, group, callerPermissions, localizable, using } = CommandDecorators;
const { expect, resolve } = Middleware;

@aliases('wl')
@callerPermissions('ADMINISTRATOR')
@desc('Deprecated/Obsolete! Remove a user from the command blacklist')
@name('whitelist')
@group('util')
@usage('<prefix>whitelist <user> [\'global\']')
export default class WhitelistCommand extends Command<Client>
{
	@using(resolve({ '<user>': 'User' }))
	@using(expect({ '<user>': 'User' }))
	@localizable
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
	{
		await message.channel.send(res(S.CMD_WHITELIST_DEPRECATED,
			{
				prefix: await message.guild.storage.settings.get('prefix'),
			},
		));

		const [, user, global] = message.content.split(/ +/);

		return this.client.commands.get('blacklist').action(message, ['remove', user, global]);
	}
}
