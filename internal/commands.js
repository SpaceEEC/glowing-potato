const fs = require('fs-extra-promise');
exports.init = (bot) => new Promise((resolve, reject) => { // eslint-disable-line
  fs.readdirAsync('./commands/')
    .then((files) => {
      try {
        files = files.filter(f => f.slice(-3) === '.js');
        bot.log(`Lade insgesamt ${files.length} Befehle.`);
        files.forEach(f => {
          const props = require(`../commands/${f}`);
          // bot.log(`Lade Befehl: ${props.help.name}`); // spam
          bot.commands.set(props.help.name, props);
          props.conf.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
          });
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

exports.reload = (bot, command) => new Promise((resolve, reject) => { // eslint-disable-line
  try {
    delete require.cache[require.resolve(`../commands/${command}`)];
    const cmd = require(`../commands/${command}`);
    bot.commands.delete(command);
    bot.aliases.forEach((cmd2, alias) => {
      if (cmd2 === command) bot.aliases.delete(alias);
    });
    bot.commands.set(command, cmd);
    cmd.conf.aliases.forEach(alias => {
      bot.aliases.set(alias, cmd.help.name);
    });
    resolve();
  } catch (e) {
    reject(e);
  }
});
