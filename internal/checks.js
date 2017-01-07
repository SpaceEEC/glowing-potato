const fs = require('fs-extra-promise');

exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  const mps = [true];
  let i = 1;
  let usage;
  bot.internal.checks.check.forEach((mProc, key) => {
    if (key === 'usage') {
      bot.log(`${usage}\n${mProc}`);
      usage = i;
    }
    if (!mProc.conf.spamProtection) {
      mps.push(mProc.run(bot, msg, cmd));
    }
    i++;
  });
  Promise.all(mps)
        .then((value) => {
          resolve(value[usage]);
        }, (reason) => {
          reject(reason);
        });
});

exports.init = (bot) => new Promise((resolve, reject) => {
  fs.readdirAsync('./checks/')
        .then((files) => {
          try {
            files = files.filter(f => f.slice(-3) === '.js');
            files.forEach((f) => {
              const file = f.split('.');
              delete require.cache[require.resolve(`../checks/${f}`)];
              const props = require(`../checks/${f}`);
              bot.internal.checks.check.set(file[0], props);
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        })
        .catch((e) => {
          reject(e);
        });
});