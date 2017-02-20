const Discord = require('discord.js');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();
const chalk = require('chalk');
bot.clk = new chalk.constructor({ enabled: true });

// log stuff
bot.debug = (msg) => console.log(`[${bot.clk.cyan(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);
bot.info = (msg) => console.log(`[${bot.clk.magenta(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);
bot.log = (msg) => console.log(`[${bot.clk.green(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);
bot.warn = (msg) => console.warn(`[${bot.clk.yellow(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);
bot.err = (msg) => console.error(`[${bot.clk.red(`${moment().format('DD.MM.YYYY HH:mm:ss')}`)}]: ${msg}`);
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
  if (err) {
    if (/(Something took too long to do.|getaddrinfo ENOTFOUND discordapp.com discordapp.com:443)/.test(err.message)) process.exit(2);
    if (err.response && err.response.res && err.response.res.text) bot.err(`Uncaught Promise Error:\n$ ${err.response.res.text}${err.stack ? `\n${err.stack}` : ''}`);
    else bot.err(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
  } else {
    bot.err('Unhandled Promise Rejection WITHOUT error. (No stacktrace, response or message.)');
  }
});

// because i want those cool colors
Discord.GuildMember.prototype.color = function getColor() {
  const roles = this.roles.filter(r => r.color !== 0).array().sort((a, b) => a.position - b.position);
  return roles[roles.length - 1] ? roles[roles.length - 1].color : 0;
};

bot.login(bot.internal.auth.dtoken);
