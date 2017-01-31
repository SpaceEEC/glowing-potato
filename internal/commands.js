const fs = require('fs-extra-promise');
exports.init = async (bot) => {
  bot.commands = new bot.methods.Collection();
  bot.aliases = new bot.methods.Collection();
  const folders = await fs.readdirAsync('./commands/');
  bot.info(`Lade insgesamt ${folders.length} Befehlskategorien.`);
  await folders.forEach(async folder => {
    const files = await fs.readdirAsync(`./commands/${folder}`);
    bot.info(`Lade insgesamt ${files.length} Befehle aus ${folder}.`);
    await files.forEach(f => {
      try {
        const props = require(`../commands/${folder}/${f}`);
        if (props.help.shortdescription.length === 0) props.conf.group = 'hidden';
        else props.conf.group = folder;
        bot.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
          bot.aliases.set(alias, props.help.name);
        });
      } catch (e) {
        bot.err(`Fehler beim Laden von ./commands/${folder}/${f}.js\n${e.stack ? e.stack : e}`);
      }
    });
  });
};


exports.reload = (bot, command) => new Promise((resolve, reject) => {
  try {
    let dir = 'FEHLER';
    if (bot.commands.has(command)) {
      dir = bot.commands.get(command).conf.group;
      command = `${dir}/${command}`;
    } else {
      dir = command.split('/')[0];
    }
    delete require.cache[require.resolve(`../commands/${command}`)];
    const cmd = require(`../commands/${command}`);
    command = cmd.help.name;
    if (cmd.help.shortdescription.length === 0) cmd.conf.group = 'hidden';
    else cmd.conf.group = dir;
    if (dir === 'FEHLER') throw new Error('Konnte Ordner nicht ermitteln!');
    bot.commands.delete(command);
    bot.aliases.forEach((cmd2, alias) => {
      if (cmd2 === command) bot.aliases.delete(alias);
    });
    bot.commands.set(command, cmd);
    cmd.conf.aliases.forEach(alias => {
      bot.aliases.set(alias, cmd.help.name);
    });
    resolve(cmd);
  } catch (e) {
    reject(e);
  }
});
