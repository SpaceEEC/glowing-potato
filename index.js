const Discord = require('discord.js');
const fs = require('fs-extra-promise');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();
bot.db = require('sqlite');
const chalk = require('chalk');
bot.clk = new chalk.constructor({ enabled: true });

// log stuff
bot.debug = (msg) => console.log(`[${bot.clk.cyan(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.info = (msg) => console.log(`[${bot.clk.magenta(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.log = (msg) => console.log(`[${bot.clk.green(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.warn = (msg) => console.warn(`[${bot.clk.yellow(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`); // eslint-disable-line
bot.err = (msg) => console.error(`[${bot.clk.red(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`); // eslint-disable-line

// config and confs
bot.confs = new Discord.Collection();
bot.config = {};

// methods
bot.methods = {};
bot.methods.inspect = (obj, hidden = false, depth = 0) => require('util').inspect(obj, hidden, depth);
bot.methods.moment = moment;
bot.methods.Embed = Discord.RichEmbed;
bot.methods.Collection = Discord.Collection;

// commands and aliases
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

// internal
bot.internal = require('./internal/internal.js');
bot.internal.auth = JSON.parse(fs.readFileSync('./var/auth.json', 'utf8'));
bot.internal.init(bot);


process.on('unhandledRejection', (err) => {
  bot.err(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
});


bot.login(bot.internal.auth.dtoken);
