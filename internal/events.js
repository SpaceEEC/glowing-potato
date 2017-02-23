// again shamelessly stolen from: github.com/dirigeants/komada/blob/master/functions/loadEvents.js

const fs = require('fs-extra-promise');
const events = Object.values(require('../node_modules/discord.js/src/util/Constants.js').Events);
const { sep } = require('path');

exports.init = async (bot) => {
  const files = await fs.readdirAsync('./events/').filter((f) => events.includes(f.split('.')[0]));
  for (const file of files) bot.on(file.split('.')[0], (...args) => require(`..${sep}events${sep + file}`).run(bot, ...args));
};
