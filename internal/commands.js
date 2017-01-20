const fs = require('fs-extra-promise');
exports.init = (bot, dir = './commands/') => new Promise((resolve, reject) => { // eslint-disable-line
  fs.readdirAsync(dir)
    .then((files) => {
      files = files.filter(f => f.slice(-3) === '.js');
      bot.log(`Lade insgesamt ${files.length} Befehle.`);
      files.forEach(f => {
        try {
          const props = require(`.${dir + f}`);
          // bot.log(`Lade Befehl: ${props.help.name}`); // spam
          bot.commands.set(props.help.name, props);
          props.conf.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
          });
        } catch (e) {
          bot.err(`Fehler beim Laden von ${dir + f}.js\n${e.stack ? e.stack : e}`);
        }
      });
      resolve();
    })
    .catch((e) => {
      reject(e);
    });
});


exports.reload = (bot, command) => new Promise((resolve, reject) => { // eslint-disable-line
  try {
    delete require.cache[require.resolve(`../commands/${command}`)];
    const cmd = require(`../commands/${command}`);
    command = cmd.help.name;
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
