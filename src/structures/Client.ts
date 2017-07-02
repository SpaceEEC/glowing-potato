import { join } from 'path';
import { Client as YAMDBFClient, ListenerUtil, logger, Logger, Providers } from 'yamdbf';

import { Config } from '../types/config';
import { Util } from '../util/Util';
import { EventHandlers } from './EventHandlers';

const { once } = ListenerUtil;

const { database, devToken, ownerID }: Config = require('../../config.json');
const { version }: { version: string } = require('../../package.json');

export class Client extends YAMDBFClient
{
	@logger public logger: Logger;
	private _eventHandlers: EventHandlers;

	public constructor()
	{
		super({
			commandsDir: join(__dirname, '..', 'commands'),
			name: 'spacebot',
			owner: [ownerID],
			pause: true,
			provider: Providers.PostgresProvider(database),
			token: devToken,
			unknownCommandError: false,
			version,
		});

		this._eventHandlers = new EventHandlers(this);
	}

	@once('pause')
	public async _onPause(): Promise<void>
	{
		Util.init(this);
		await this.setDefaultSetting('prefix', '$');
		this.emit('continue');
	}
}
