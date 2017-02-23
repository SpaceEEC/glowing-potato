exports.add = async (bot, guild, name, response, author) => {
  bot.info(`[tag] INSERT INTO "tags" (guild, name, response, author) VALUES (${guild}, ${name}, ${response}, ${author})`);
  await bot.db.run('INSERT INTO "tags" (guild, name, response, author) VALUES (?, ?, ?, ?)',
    [guild, name, response, author]);
  bot.internal.tags
    .set(`${guild}|${name}`,
    {
      guild: guild,
      name: name,
      response: response,
      author: author,
    });
};


exports.edit = async (bot, guild, name, response) => {
  bot.info(`[tag] UPDATE tags SET response='${response}' WHERE guild='${guild}' AND name='${name}'`);
  await bot.db.run('UPDATE tags SET response=? WHERE guild=? AND name=?',
    [response, guild, name]);
  bot.internal.tags.get(`${guild}|${name}`).response = response;
};


exports.remove = async (bot, guild, name) => {
  bot.info(`[tag] DELETE FROM tags WHERE guild='${guild}' AND name='${name}'`);
  await bot.db.run('DELETE FROM tags WHERE guild=? AND name=?',
    [guild, name]);
  bot.internal.tags.delete(`${guild}|${name}`);
};


exports.init = async (bot) => {
  bot.internal.tags = new bot.methods.Collection();
  const rows = await bot.db.all(`SELECT * FROM tags`);
  bot.info(`Lade insgesamt ${rows.length} Tags.`);
  for (let i = 0; i < rows.length; i++) bot.internal.tags.set(`${rows[i].guild}|${rows[i].name}`, rows[i]);
};
