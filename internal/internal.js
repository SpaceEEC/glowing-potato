const fs = require('fs-extra-promise');
const { sep } = require('path');

exports.init = async (bot) => {
  bot.config = {};
  bot.db = require('sqlite');
  await bot.db.open(`.${sep}var${sep}db.sqlite`);
  const stuff = await bot.db.get('SELECT * FROM config');
  for (let key in stuff) {
    bot.config[key] = stuff[key];
  }
  const files = await fs.readdirAsync(`.${sep}internal`);
  for (const file of files) {
    if (file === 'internal.js') continue;
    try {
      delete require.cache[require.resolve(`./${file}`)];
      bot.internal[file.slice(0, -3)] = require(`./${file}`);
      if (bot.internal[file.slice(0, -3)].init) {
        bot.internal[file.slice(0, -3)].init(bot).catch(e => bot.err(`${e}\n${e.stack}`));
      }
    } catch (e) { bot.err(e.stack ? e.stack : e); }
  }
};

exports.setGame = async (bot, game) => {
  await bot.db.run(`UPDATE config SET game=?`, [game]);
  await bot.user.setGame(game);
  return bot.user.presence.game.name ? bot.user.presence.game.name : 'null';
};

exports.reload = (bot, name, file) => {
  delete require.cache[require.resolve(`./${file}.js`)];
  bot.internal[name] = require(`./${file}.js`);
};
