import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { desc, group, name, ownerOnly, usage } = CommandDecorators;

@desc('Some generic test command.')
@name('test')
@group('util')
@ownerOnly
@usage('<prefix>test [...Maybe]')
export default class TestCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, code: string[]): Promise<void>
	{
		throw Error('bork');
	}
}
