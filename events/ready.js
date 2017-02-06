exports.run = async (bot) => {
  bot.config.prefixMention = new RegExp(`^<@!?${bot.user.id}>`);
  const app = await bot.fetchApplication();
  bot.config.ownerID = app.owner.id;
  bot.config.owner = `${app.owner.username}#${app.owner.discriminator}`;
  bot.log(`${app.name} bereit!`);
  bot.user.setGame(bot.config.game);
};
