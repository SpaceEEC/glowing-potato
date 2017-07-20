import { Logger } from 'yamdbf';

import { Client } from './structures/Client';
import { Config } from './types/Config';

const { logLevel }: Config = require('../config.json');

Logger.instance().setLogLevel(logLevel);

const client: Client = new Client();
client.start();
