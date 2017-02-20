exports.run = async (bot, msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === 'dm') {
    msg.channel.sendMessage("(ง'̀-'́)ง");
    return;
  }
  if (msg.channel.type !== 'text') return;
  const conf = bot.confs.get(msg.guild.id);
  if (conf.ignchannels && conf.ignchannels.includes(msg.channel.id)) return;
  if (conf.ignusers && conf.ignusers.includes(msg.author.id)) return;
  if (!msg.content.startsWith(conf.prefix) && !bot.config.prefixMention.test(msg.content)) return;
  let prefixLength = conf.prefix.length;
  if (bot.config.prefixMention.test(msg.content)) {
    prefixLength = bot.config.prefixMention.exec(msg.content)[0].length + 1;
  }
  const command = msg.content.slice(prefixLength).split(' ')[0].toLowerCase();
  const params = msg.content.slice(prefixLength).split(' ').slice(1).filter(a => a); // eslint-disable-line newline-per-chained-call
  let Command;
  if (bot.commands.has(command)) {
    Command = bot.commands.get(command);
  } else if (bot.aliases.has(command)) {
    Command = bot.commands.get(bot.aliases.get(command));
  }
  if (Command) {
    msg.conf = conf;
    msg.cmd = command;
    bot.internal.checks.run(bot, msg, Command)
      .then(() => {
        new Command(bot).run(msg, params)
          .catch((e) => {
            bot.err(`[${command}] [uncaught]: ${e.stack}\n${e.response && e.response.res && e.response.res.text ? e.response.res.text : ''}`);
            msg.channel.sendMessage(`Es ist ein unbehandelter Fehler aufgetreten: \`${e.message}\`.\n\nBitten kontaktiere \`${bot.config.owner}\`.`);
          });
      })
      .catch((reason) => {
        if (reason) {
          if (reason.stack) bot.err(reason.stack);
          msg.channel.sendMessage(reason);
        }
      });
  }
};
