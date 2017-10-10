import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';

const { clientPermissions, desc, group, name, ownerOnly, usage } = CommandDecorators;

@clientPermissions('SEND_MESSAGES')
@desc('Some generic test command.')
@name('test')
@group('util')
@ownerOnly
@usage('<prefix>test [...Maybe]')
export default class TestCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, code: string[]): Promise<CommandResult> {
		throw Error('Some error, who knows what use it might have later.');
	}
}
