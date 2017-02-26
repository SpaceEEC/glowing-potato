exports.run = async (bot) => {
  bot.config.prefixMention = new RegExp(`^<@!?${bot.user.id}>`);
  const app = await bot.fetchApplication();
  const owner = await bot.fetchUser(bot.config.ownerID);
  bot.config.owner = `${owner.username}#${owner.discriminator}`;
  /* Why am I not getting an owner anymore?
   * bot.config.ownerID = app.owner.id;
   * bot.config.owner = `${app.owner.username}#${app.owner.discriminator}`;*/
  bot.log(`${app.name} bereit!`);
  bot.user.setGame(bot.config.game);
};
