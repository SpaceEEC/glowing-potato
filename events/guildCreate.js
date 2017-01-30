exports.run = async (bot, guild) => {
  const newguild = bot.confs.get('default');
  newguild.id = guild.id;
  newguild.name = guild.name;
  bot.confs.set(newguild.id, newguild);
  bot.db.run('INSERT INTO confs(id,name,prefix,ignchannels,ignusers,disabledcommands)'
    + 'VALUES (?,?,?,?,?,?);',
    [newguild.id, newguild.name, newguild.prefix, '[]', '[]', '[]']);
  bot.log(`Gilde (${guild.id}): ${guild.name} beigetreten!`);
};
