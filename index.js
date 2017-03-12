const Commando = require('discord.js-commando');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const { join } = require('path');
const { oneLine } = require('common-tags');
const winston = require('winston');
const SequelizeProvider = require(join(__dirname, 'dataProviders', 'SequelizeProvider.js'));
const SQLite = require(join(__dirname, 'dataProviders', 'SQLite.js'));
const client = new Commando.Client({
	owner: '218348062828003328',
	commandPrefix: '$',
	unknownCommandResponse: false,
	disableEveryone: true,
	disabledEvents: [
		'TYPING_START'
	]
});
require(join(__dirname, 'events', 'events')).init(client);

client.setProvider(new SequelizeProvider(new SQLite().db));

client.registry
	.registerGroups([
		['util', 'util'],
		['adminstuff', 'Adminstuff'],
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
	.registerTypesIn(join(__dirname, 'types'))
	.registerCommandsIn(join(__dirname, 'commands'));

client.dispatcher
	.addInhibitor(msg => {
		if (!msg.guild) return false;
		if (msg.author === msg.guild.owner || client.isOwner(msg.author)) return false;
		const staffRoles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));
		if (msg.member.roles.some(r => staffRoles.includes(r.id))) return false;
		if (msg.guild.settings.get('ignoredUsers', []).includes(msg.author.id)) return [`User(${msg.author.id}) is ignored in this guild(${msg.guild.id})`, null];
		if (msg.guild.settings.get('ignoredChannels', []).includes(msg.channel.id)) return [`Channel(${msg.channel.id}) is ignored in this guild(${msg.guild.id})`, null];
		return false;
	});

client
	.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', (event) => {
		winston.error(`Disconnected after ${moment.duration(client.uptime).format('D hh:mm:ss')}.`, event.code);
		process.exit(100);
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof Commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		winston.info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		winston.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

process.on('unhandledRejection', (err) => {
	if (err) {
		if (/(Something took too long to do.|getaddrinfo)/.test(err.message)) process.exit(2);
		if (err.response && err.response.res && err.response.res.text) winston.error(`Uncaught Promise Error:\n$ ${err.response.res.text}${err.stack ? `\n${err.stack}` : ''}`);
		else winston.error(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
	} else {
		winston.error('Unhandled Promise Rejection WITHOUT error. (No stacktrace, response or message.)');
	}
});

client.login(require('./auth.json').token);
