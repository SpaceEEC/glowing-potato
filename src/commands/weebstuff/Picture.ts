import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';

const { expect } = Middleware;
const { clientPermissions, desc, group, guildOnly, name, usage, using } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from konachan.net or safebooru.donmai.us')
@name('picture')
@group('weebstuff')
@guildOnly
@usage('<prefix>picture <...Tags>')
export default class PictureCommand extends Command<Client>
{
	@using(expect({ '<...Tags>': 'String' }))
	@ReportError
	public action(message: Message, tags: string[]): Promise<CommandResult>
	{

		const command: string = tags.length > 2
			? 'konachan'
			: ['konachan', 'donmai'][Math.floor(Math.random() * 2)];

		return this.client.commands.get(command).action(message, tags);
	}
}
