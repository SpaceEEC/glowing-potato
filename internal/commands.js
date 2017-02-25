const fs = require('fs-extra-promise');
const { sep } = require('path');

exports.init = async (bot) => {
  bot.commands = new bot.methods.Collection();
  bot.aliases = new bot.methods.Collection();
  const folders = await fs.readdirAsync(`.${sep}commands`);
  bot.info(`Lade insgesamt ${folders.length} Befehlskategorien.`);
  for (const folder of folders) {
    const files = await fs.readdirAsync(`.${sep}commands${sep + folder}`);
    bot.info(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
    for (const f of files) {
      try {
        const props = require(`..${sep}commands${sep + folder + sep + f}`);
        bot.commands.set(props.help.name, props);
        for (const alias of props.conf.aliases) bot.aliases.set(alias, props.help.name);
      } catch (e) {
        bot.err(`Fehler beim Laden von .${sep}commands${sep + folder + sep + f}.js\n${e.stack ? e.stack : e}`);
      }
    }
  }
};


exports.reload = async (bot, command) => {
  let dir;
  if (bot.commands.has(command)) {
    dir = bot.commands.get(command).conf.group;
    command = dir + sep + command;
  } else { dir = command.split(sep)[0]; }
  delete require.cache[require.resolve(`..${sep}commands${sep + command}`)];
  const cmd = require(`..${sep}commands${sep + command}`);
  command = cmd.help.name;
  bot.commands.delete(command);
  bot.aliases.forEach((cmd2, alias) => {
    if (cmd2 === command) bot.aliases.delete(alias);
  });
  bot.commands.set(command, cmd);
  for (const alias of cmd.conf.aliases) bot.aliases.set(alias, cmd.help.name);
  return cmd;
};
