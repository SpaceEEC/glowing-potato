import { Command as YAMDBFCommand } from 'yamdbf';

import { Client } from './Client';

/**
 * Abstract class to avoid weird bug with reloading when there is no constructor in the command itself present.
 * Happens when only decorators are being used.
 * @abstract
 */
export abstract class Command<T extends Client = Client> extends YAMDBFCommand<T>
{
	constructor(client: Client) { super(); }
}
