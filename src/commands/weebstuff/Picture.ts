import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { clientPermissions, desc, group, guildOnly, name, usage } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from konachan.net or safebooru.donmai.us')
@name('picture')
@group('weebstuff')
@guildOnly
@usage('<prefix>picture <...tags>')
export default class PictureCommand extends Command<Client>
{
	@ReportError
	public action(message: Message, tags: string[]): void
	{

		const command: string = tags.length > 2
			? 'konachan'
			: ['konachan', 'donmai'][Math.floor(Math.random() * 2)];

		return this.client.commands.get(command).action(message, tags);
	}
}
