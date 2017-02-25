// shamelessly stolen from: github.com/dirigeants/komada/blob/master/functions/runCommandInhibitors.js
const fs = require('fs-extra-promise');


exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  const mps = [true];
  let i = 1;
  let usage;
  bot.internal.checks.check.forEach((mProc, key) => {
    if (key === 'usage') {
      bot.log(`[Log das überhaupt?] ${usage}\n${mProc}`);
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


exports.init = async (bot) => {
  bot.internal.checks.check = new bot.methods.Collection();
  const files = (await fs.readdirAsync('./checks/')).filter(f => f.slice(-3) === '.js');
  bot.info(`Lade insgesamt ${files.length} Checks.`);
  try {
    for (const f of files) {
      delete require.cache[require.resolve(`../checks/${f}`)];
      const props = require(`../checks/${f}`);
      bot.internal.checks.check.set(f.split('.')[0], props);
    }
  } catch (e) {
    bot.err(`[checks.js] Fehler beim Laden: ${e.stack ? e.stack : e}`);
  }
};
