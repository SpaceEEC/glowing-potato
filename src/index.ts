import { Logger } from 'yamdbf/bin';

import { Client } from './structures/Client';

Logger.instance().setLogLevel(Logger.DEBUG);

const client: Client = new Client();
client.start();
