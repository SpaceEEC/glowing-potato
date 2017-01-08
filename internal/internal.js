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
          throw e.stack ? e.stack : e;
        }
      });
      resolve(modules);
    }).catch((e) => { throw e.stack ? e.stack : e; });
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
