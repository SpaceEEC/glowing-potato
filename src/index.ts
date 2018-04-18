import { Logger } from 'yamdbf';

import { Client } from './structures/Client';
import { RavenUtil } from './util/RavenUtil';

Logger.instance().setLogLevel(Number(process.env.LOGLEVEL));

const client: Client = new Client();
client.start();

process.on('unhandledRejection', (error: Error) =>
{
	Logger.instance().error('PromiseRejection', error.message, error.stack);
});

process.on('uncaughtException', (error: Error) => {
	RavenUtil.error('Uncaught Exception', error)
		.then(() => process.exit(1))
		.catch(() => process.exit(1));
});
