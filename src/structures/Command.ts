import { Command as YAMDBFCommand, Message } from 'yamdbf';

import { CommandResult } from '../types/CommandResult';
import { Client } from './Client';

export { CommandResult } from '../types/CommandResult';

/**
 * Abstract class to avoid weird bug with reloading when there is no constructor in the command itself present.
 * Happens when only decorators are being used.
 * @abstract
 */
export abstract class Command<T extends Client = Client> extends YAMDBFCommand<T>
{
	constructor(client: Client) { super(); }

	public abstract action(message: Message, args: any[]): Promise<CommandResult> | CommandResult;
}
