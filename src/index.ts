import { Logger } from 'yamdbf';

import { Client } from './structures/Client';
import { Config } from './types/Config';
import { RavenUtil } from './util/RavenUtil';

const { logLevel }: Config = require('../config.json');

Logger.instance().setLogLevel(logLevel);

const client: Client = new Client();
client.start();

process.on('uncaughtException', (error: Error) =>
{
	RavenUtil.error('Uncaught Exception', error)
		.then(() => process.exit(1));
});
