exports.add = (bot, guild, name, response, author) => new Promise((resolve, reject) => {
  bot.info(`[tag] INSERT INTO "tags" (guild, name, response, author) VALUES (${guild}, ${name}, ${response}, ${author})`);
  bot.db.run('INSERT INTO "tags" (guild, name, response, author) VALUES (?, ?, ?, ?)',
    [guild, name, response, author])
    .then(() => {
      try {
        bot.internal.tags
          .set(`${guild}|${name}`,
          {
            guild: guild,
            name: name,
            response: response,
            author: author,
          });
        resolve();
      } catch (e) {
        reject(e);
      }
    })
    .catch((e) => reject(e));
});


exports.edit = (bot, guild, name, response) => new Promise((resolve, reject) => {
  bot.info(`[tag] UPDATE tags SET response='${response}' WHERE guild='${guild}' AND name='${name}'`);
  bot.db.run('UPDATE tags SET response=? WHERE guild=? AND name=?',
    [response, guild, name])
    .then(() => {
      try {
        bot.internal.tags.get(`${guild}|${name}`).response = response;
        resolve();
      } catch (e) {
        reject(e);
      }
    })
    .catch((e) => reject(e));
});


exports.remove = (bot, guild, name) => new Promise((resolve, reject) => {
  bot.info(`[tag] DELETE FROM tags WHERE guild='${guild}' AND name='${name}'`);
  bot.db.run('DELETE FROM tags WHERE guild=? AND name=?',
    [guild, name])
    .then(() => {
      try {
        bot.internal.tags.delete(`${guild}|${name}`);
        resolve();
      } catch (e) {
        reject(e);
      }
    })
    .catch((e) => reject(e));
});


exports.init = (bot) => new Promise((resolve, reject) => {
  bot.internal.tags = new bot.methods.Collection();
  bot.db.all(`SELECT * FROM tags`)
    .then(rows => {
      try {
        bot.info(`Lade insgesamt ${rows.length} Tags.`);
        for (let i = 0; i < rows.length; i++) {
          bot.internal.tags.set(`${rows[i].guild}|${rows[i].name}`, rows[i]);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    })
    .catch((e) => reject(e));
});
