import { oneLine } from 'common-tags';
import { Guild, Message, Role } from 'discord.js';
import { Command, CommandGroup, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import * as moment from 'moment';
import * as path from 'path';
import * as winston from 'winston';
import SequelizeProvider from './dataProviders/SequelizeProvider';
import SQLite from './dataProviders/SQLite';
import { registerEvents } from './events/events';

const { defaultPrefix, logLevel, maintoken, ownerID }: { defaultPrefix: string, logLevel: string, maintoken: string, ownerID: string } = require('../config');
const { DMManager }: { DMManager: any } = require('yamdbf-addon-dm-manager');

const client: CommandoClient = new CommandoClient({
	owner: ownerID,
	commandPrefix: defaultPrefix,
	unknownCommandResponse: false,
	disableEveryone: true,
	disabledEvents: [
		'TYPING_START'
	]
});
const disconnect: winston.LoggerInstance = new (winston.Logger)({
	transports: [
		new winston.transports.File({ filename: '../disconnects.log', level: 'disconnect', timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss')) }),
		new winston.transports.Console({ colorize: true, level: 'disconnect', prettyPrint: true, timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss')) })
	],
	levels: { disconnect: 0 }
});

winston.addColors({
	disconnect: 'red',
	silly: 'magenta',
	debug: 'blue',
	verbose: 'cyan',
	info: 'green',
	warn: 'yellow',
	error: 'red'
});
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	level: logLevel,
	prettyPrint: true,
	colorize: true,
	silent: false,
	timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss'))
});

registerEvents(client);

client.setProvider(new SequelizeProvider(new SQLite().db));

client.registry
	.registerGroups([
		['util', 'util'],
		['administration', 'Administration'],
		['modstuff', 'Modstuff'],
		['common', 'Commonstuff'],
		['tags', 'Tagstuff'],
		['miscellaneous', 'Miscellaneous'],
		['weebstuff', 'Weebstuff'],
		['music', 'Musicstuff'],
	])
	.registerDefaultTypes()
	.registerDefaultGroups()
	.registerDefaultCommands({ eval_: false })
	.registerTypesIn(path.join(__dirname, 'types'))
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.dispatcher.addInhibitor((msg: Message) => {
	if (!msg.guild) return false;

	if (msg.author.id === msg.guild.ownerID || client.isOwner(msg.author)) return false;

	const staffRoles: string[] = client.provider.get(msg.guild.id, 'adminRoles', []).concat(client.provider.get(msg.guild.id, 'modRoles', []));
	if (msg.member.roles.some((r: Role) => staffRoles.includes(r.id))) return false;

	const ignoredUsers: string[] = client.provider.get(msg.guild.id, 'ignoredUsers', []);
	if (ignoredUsers.includes(msg.author.id)) return [`User(${msg.author.id}) is ignored in this guild(${msg.guild.id})`, null];

	const ignoredChannels: string[] = client.provider.get(msg.guild.id, 'ignoredChannels', []);
	if (ignoredChannels.includes(msg.channel.id)) return [`Channel(${msg.channel.id}) is ignored in this guild(${msg.guild.id})`, null];

	return false;
});

client
	.on('error', winston.error)
	.on('warn', winston.warn)
	.once('ready', () => {
		(client as any).dmManager = new DMManager(client, '260850209699921931');
		client.user.setGame(client.provider.get('global', 'game', null));
	})
	.on('ready', () => {
		winston.info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', (event: any) => {
		disconnect.log('disconnect', '', event.code, ': ', event.reason);
		if (event.code === 1000) process.exit(200);
	})
	.on('reconnecting', () => winston.warn('Reconnecting...'))
	.on('commandError', (cmd: Command, err: Error) => {
		if (err instanceof FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg: CommandMessage, reason: string) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild: Guild, prefix: string) => {
		winston.info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild: Guild, command: Command, enabled: boolean) => {
		winston.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

process.on('unhandledRejection', (err: any) => {
	if (err) {
		if (/Something took too long to do.|getaddrinfo|ETIMEDOUT|ECONNRESET/.test(err.message)) process.exit(200);
		if (err.url) winston.error(`Uncaught Promise Error:\n$ ${err.status} ${err.statusText}\n${err.text}`);
		else winston.error(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
	} else {
		winston.error('Unhandled Promise Rejection without an error. (No stacktrace, response or message.)');
	}
});

client.login(maintoken);
