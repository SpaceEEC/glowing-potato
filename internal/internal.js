const fs = require('fs-extra-promise');

exports.init = async (bot) => {
  const modules = [];
  bot.config = {};
  bot.db = require('sqlite');
  await bot.db.open('./var/db.sqlite');
  const stuff = await bot.db.get('SELECT * FROM config');
  for (let key in stuff) {
    bot.config[key] = stuff[key];
  }
  const files = fs.readdirSync('./internal/');
  files.forEach((f) => {
    try {
      if (f !== 'internal.js') {
        delete require.cache[require.resolve(`./${f}`)];
        bot.internal[f.substring(0, f.length - 3)] = require(`./${f}`);
        modules.push(f.substring(0, f.length - 3));
        if (bot.internal[f.substring(0, f.length - 3)].init) {
          bot.internal[f.substring(0, f.length - 3)].init(bot).catch(e => bot.err(`${e}\n${e.stack}`));
        }
      }
    } catch (e) {
      throw new Error(e.stack ? e.stack : e);
    }
  });
};

exports.setGame = async (bot, game) => {
  await bot.db.run(`UPDATE config SET game=?`, [game]);
  await bot.user.setGame(game);
  return bot.user.presence.game.name ? bot.user.presence.game.name : 'null';
};

exports.reload = (bot, name, file) => new Promise((resolve, reject) => {
  try {
    delete require.cache[require.resolve(`./${file}.js`)];
    bot.internal[name] = require(`./${file}.js`);
    resolve();
  } catch (e) {
    reject(e);
  }
});
