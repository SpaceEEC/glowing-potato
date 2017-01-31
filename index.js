const Discord = require('discord.js');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();
const chalk = require('chalk');
bot.clk = new chalk.constructor({ enabled: true });

// log stuff
bot.debug = (msg) => console.log(`[${bot.clk.cyan(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.info = (msg) => console.log(`[${bot.clk.magenta(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.log = (msg) => console.log(`[${bot.clk.green(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);  // eslint-disable-line
bot.warn = (msg) => console.warn(`[${bot.clk.yellow(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`); // eslint-disable-line
bot.err = (msg) => console.error(`[${bot.clk.red(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`); // eslint-disable-line
bot.inspect = (obj, hidden = false, depth = 0) => require('util').inspect(obj, hidden, depth);

// methods
bot.methods = {};
bot.methods.moment = moment;
bot.methods.Embed = Discord.RichEmbed;
bot.methods.Collection = Discord.Collection;

// internal
bot.internal = require('./internal/internal.js');
bot.internal.auth = require('./var/auth.json');
bot.internal.init(bot);


process.on('unhandledRejection', (err) => {
  bot.err(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
});


bot.login(bot.internal.auth.dtoken);
