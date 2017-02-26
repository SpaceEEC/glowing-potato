exports.run = async (bot, guild) => {
  bot.log(`Gilde (${guild.id}): ${guild.name} beigetreten!`);
  const newguild = bot.confs.get('default');
  newguild.id = guild.id;
  newguild.name = guild.name;
  bot.confs.set(newguild.id, newguild);
  await bot.db.run('INSERT INTO confs(id,name,prefix,ignchannels,ignusers,disabledcommands)'
    + 'VALUES (?,?,?,?,?,?);',
    [JSON.stringify(newguild.id), JSON.stringify(newguild.name), JSON.stringify(newguild.prefix), '[]', '[]', '[]']);
};
