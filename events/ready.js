exports.run = async (bot) => {
  bot.config.prefixMention = new RegExp(`^<@!?${bot.user.id}>`);
  const app = await bot.fetchApplication();
  bot.log(`${app.name} bereit!`);
  bot.user.setGame(bot.config.game);
};
