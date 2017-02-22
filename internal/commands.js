const fs = require('fs-extra-promise');
const path = require('path');

exports.init = async (bot) => {
  bot.commands = new bot.methods.Collection();
  bot.aliases = new bot.methods.Collection();
  const folders = await fs.readdirAsync(`.${path.sep}commands`);
  bot.info(`Lade insgesamt ${folders.length} Befehlskategorien.`);
  for (const folder of folders) {
    const files = await fs.readdirAsync(`.${path.sep}commands${path.sep + folder}`);
    bot.info(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
    for (const f of files) {
      try {
        const props = require(`..${path.sep}commands${path.sep + folder + path.sep + f}`);
        bot.commands.set(props.help.name, props);
        for (const alias of props.conf.aliases) bot.aliases.set(alias, props.help.name);
      } catch (e) {
        bot.err(`Fehler beim Laden von .${path.sep}commands${path.sep + folder + path.sep + f}.js\n${e.stack ? e.stack : e}`);
      }
    }
  }
};


exports.reload = (bot, command) => new Promise((resolve, reject) => {
  try {
    let dir;
    if (bot.commands.has(command)) {
      dir = bot.commands.get(command).conf.group;
      command = dir + path.sep + command;
    } else { dir = command.split(path.sep)[0]; }
    delete require.cache[require.resolve(`..${path.sep}commands${path.sep + command}`)];
    const cmd = require(`..${path.sep}commands${path.sep + command}`);
    command = cmd.help.name;
    bot.commands.delete(command);
    bot.aliases.forEach((cmd2, alias) => {
      if (cmd2 === command) bot.aliases.delete(alias);
    });
    bot.commands.set(command, cmd);
    for (const alias of cmd.conf.aliases) bot.aliases.set(alias, cmd.help.name);
    resolve(cmd);
  } catch (e) {
    reject(e);
  }
});
