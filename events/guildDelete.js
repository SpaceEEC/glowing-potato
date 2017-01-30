exports.run = async (bot, guild) => {
  bot.confs.get(guild.id).delete();
  bot.db.run(`DELETE FROM confs WHERE id=${guild.id}`);
  bot.log(`Gilde (${guild.id}): ${guild.name} verlassen!`);
};
