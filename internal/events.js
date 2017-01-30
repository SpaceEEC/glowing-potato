// again shamelessly stolen from: github.com/dirigeants/komada/blob/master/functions/loadEvents.js

const fs = require('fs-extra-promise');
let events = require('../node_modules/discord.js/src/util/Constants.js').Events;
events = Object.keys(events).map(k => events[k]);

exports.init = (bot) => new Promise((resolve, reject) => {
  fs.readdirAsync('./events/').then((files) => {
    bot.debug(files.map(f => f));
    files = files.filter((f) => events.includes(f.split('.')[0]));
    bot.debug(files.map(f => f));
    files.forEach((f) => {
      bot.on(f.split('.')[0], (...args) => require(`../events/${f}`).run(bot, ...args));
    });
    resolve();
  })
    .catch(e => reject(e.stack));
});
