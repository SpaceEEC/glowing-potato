const fs = require('fs-extra-promise');


exports.init = (bot) => new Promise((resolve) => {
  const modules = [];
  fs.readdirAsync('./internal/')
    .then((files) => {
      files.forEach((f) => {
        try {
          if (f !== 'internal.js') {
            delete require.cache[require.resolve(`./${f}`)];
            bot.internal[f.substring(0, f.length - 3)] = require(`./${f}`);
            modules.push(f.substring(0, f.length - 3));
            if (bot.internal[f.substring(0, f.length - 3)].init) {
              bot.internal[f.substring(0, f.length - 3)].init(bot).catch(bot.err);
            }
          }
        } catch (e) {
          throw new Error(e.stack ? e.stack : e);
        }
      });
      resolve(modules);
    }).catch((e) => { throw new Error(e.stack ? e.stack : e); });
});

exports.setGame = (bot, game) => new Promise((resolve, reject) => {
  bot.db.run(`UPDATE config SET game=?`, [game])
    .then(() => {
      bot.user.setGame(game).then((user) => {
        resolve(user.presence.game.name);
      })
      .catch((e) => reject(e));
    })
    .catch((e) => reject(e));
});

exports.reload = (bot, name, file) => new Promise((resolve, reject) => {
  try {
    delete require.cache[require.resolve(`./${file}.js`)];
    bot.internal[name] = require(`./${file}.js`);
    resolve();
  } catch (e) {
    reject(e);
  }
});
