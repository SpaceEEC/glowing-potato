exports.run = async (bot) => {
  bot.err(`Disconnected nach ${bot.methods.moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Minuten], s [Sekunden]')}.`);
  process.exit(100);
};
