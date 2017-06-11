import { oneLine } from 'common-tags';
import { Guild, GuildChannel, Message, Role } from 'discord.js';
import { Command, CommandGroup, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import * as moment from 'moment';
import { join } from 'path';
import { add, addColors, error, info, Logger, LoggerInstance, remove, transports, warn } from 'winston';

import { SequelizeProvider } from './dataProviders/SequelizeProvider';
import { registerEvents } from './events/events';
import { Util } from './util/util';

const { defaultPrefix, logLevel, maintoken, ownerID }: {
	defaultPrefix: string;
	logLevel: string;
	maintoken: string;
	ownerID: string;
} = require('../config');

const client: CommandoClient = new CommandoClient({
	commandPrefix: defaultPrefix,
	disableEveryone: true,
	disabledEvents: [
		'TYPING_START',
	],
	owner: ownerID,
	unknownCommandResponse: false,
});

const disconnect: LoggerInstance = new (Logger)({
	levels: { disconnect: 0 },
	transports: [
		new transports.File({
			filename: '../disconnects.log',
			level: 'disconnect',
			timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss')),
		}),
		new transports.Console({
			colorize: true,
			level: 'disconnect',
			prettyPrint: true,
			timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss')),
		}),
	],
});

// tslint:disable:object-literal-sort-keys

addColors({
	disconnect: 'red',
	silly: 'magenta',
	debug: 'blue',
	verbose: 'cyan',
	info: 'green',
	warn: 'yellow',
	error: 'red',
});

// tslint:enable:object-literal-sort-keys
remove(transports.Console);

add(transports.Console, {
	colorize: true,
	level: logLevel,
	prettyPrint: true,
	silent: false,
	timestamp: (() => moment().format('DD.MM.YYYY HH:mm:ss')),
});

registerEvents(client);

client.setProvider(new SequelizeProvider());

client.registry
	.registerGroups([
		['util', 'util'],
		['administration', 'Administration'],
		['moderation', 'Moderation'],
		['info', 'Information'],
		['tags', 'Tagstuff'],
		['miscellaneous', 'Miscellaneous'],
		['weebstuff', 'Weebstuff'],
		['music', 'Musicstuff'],
	])
	.registerDefaultTypes()
	.registerDefaultGroups()
	.registerDefaultCommands({ help: false, eval_: false })
	.registerTypesIn(join(__dirname, 'types'))
	.registerCommandsIn(join(__dirname, 'commands'));

client.dispatcher.addInhibitor((msg: Message) => {
	if (!msg.guild) return false;

	if (msg.author.id === msg.guild.ownerID || client.isOwner(msg.author)) return false;

	const staffRoles: string[] = client.provider.get(msg.guild.id, 'adminRoles', [])
		.concat(client.provider.get(msg.guild.id, 'modRoles', []));
	if (msg.member.roles.some((r: Role) => staffRoles.includes(r.id))) return false;

	const ignoredUsers: string[] = client.provider.get(msg.guild.id, 'ignoredUsers', []);
	if (ignoredUsers.includes(msg.author.id)) {
		return [`User(${msg.author.id}) is ignored in this guild(${msg.guild.id})`, null];
	}

	const ignoredChannels: string[] = client.provider.get(msg.guild.id, 'ignoredChannels', []);
	if (ignoredChannels.includes(msg.channel.id)) {
		return [`Channel(${msg.channel.id}) is ignored in this guild(${msg.guild.id})`, null];
	}

	// false as any, because reasons
	return false as any;
});

client
	.on('error', error)

	.on('warn', warn)

	.once('ready', () => {
		client.user.setGame(client.provider.get('global', 'game', null));
		Util.init(client);
		(client as any).ws.connection.on('close', (event: any) => {
			disconnect.log('disconnect', '', event.code, ': ', event.reason);
		});
	})

	.on('ready', () => {
		info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})

	.on('disconnect', (event: any) => {
		process.exit(200);
	})

	.on('reconnecting', () => warn('Reconnecting...'))

	.on('commandError', (cmd: Command, err: any) => {
		if (err instanceof FriendlyError) return;
		if (err.url) error(`Uncaught Promise Error:\n$ ${err.status} ${err.statusText}\n${err.text}\n${err.stack || err}`);
		else error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})

	.on('commandBlocked', (msg: CommandMessage, reason: string) => {
		info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild: Guild, prefix: string) => {
		info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})

	.on('commandStatusChange', (guild: Guild, command: Command, enabled: boolean) => {
		info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})

	.on('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) => {
		info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})

	.on('channelCreate', (channel: GuildChannel) => {
		if (!channel.guild) return;
		(client.registry.resolveCommand('administration:mutedrole') as any).newChannel(channel);
	});

process.on('unhandledRejection', (err: any) => {
	if (err) {
		if (/Something took too long to do.|getaddrinfo|ETIMEDOUT|ECONNRESET/.test(err.message)) process.exit(200);
		else error('Unhandled promise rejection:', err);
	} else { error('Unhandled Promise Rejection without an error. (No stacktrace, response or message.)'); }
});

client.login(maintoken);
