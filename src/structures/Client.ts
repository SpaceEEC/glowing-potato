import { join } from 'path';
import { Client as YAMDBFClient, ListenerUtil, logger, Logger } from 'yamdbf';

import { Config } from '../types/config';
import { Util } from '../util/Util';

const { once } = ListenerUtil;

const { devToken, ownerID }: Config = require('../../config.json');
const { version }: { version: string } = require('../../package.json');

export class Client extends YAMDBFClient
{
	@logger public logger: Logger;

	public constructor()
	{
		super({
			commandsDir: join(__dirname, '..', 'commands'),
			name: 'spacebot',
			owner: [ownerID],
			pause: true,
			token: devToken,
			unknownCommandError: false,
			version,
		});

	}

	@once('pause')
	public async _onPause(): Promise<void>
	{
		Util.init(this);
		await this.setDefaultSetting('prefix', '$');
		this.emit('continue');
	}
}
