exports.add = (bot, guild, type, id, color, name, icon_url, description, img) => new Promise((resolve, reject) => {
  if (type === 'text') {
    bot.info(`[quote] INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (${guild}, ${type}, ${id}, ${color}, ${name}, ${icon_url}, ${description}, ${null})`);
    bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [ // eslint-disable-line
      guild,
      type,
      id,
      color,
      name,
      icon_url,
      description,
      null])
      .then(() => {
        try {
          bot.internal.quotes.set(`${guild}|${id}`, {
            color: color,
            fields: [
              {
                name: '\u200b',
                value: description,
              },
            ],
            footer: { text: `${name} | ${id}`, icon_url: icon_url },
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      }).catch((e) => reject(e));
  } else if (type === 'img') {
    bot.info(`[quote] INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (${guild}, ${type}, ${id}, ${color}, ${name}, ${icon_url}, ${description}, ${img})`);
    bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [ // eslint-disable-line
      guild,
      type,
      id,
      color,
      name,
      icon_url,
      description,
      img])
      .then(() => {
        try {
          bot.internal.quotes.set(`${guild}|${id}`, {
            color: color,
            description: description,
            footer: {
              text: `${name} | ${id}`,
              icon_url: icon_url,
            },
            type: 'image',
            image: { url: img },
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .catch((e) => reject(e));
  }
});

exports.remove = async (bot, guild, id) => {
  bot.internal.quotes.delete(`${guild}|${id}`);
  await bot.db.run('DELETE FROM quotes WHERE guild=? AND id=?', [guild, id]);
};

exports.init = (bot) => new Promise((resolve, reject) => {
  bot.internal.quotes = new bot.methods.Collection();
  bot.db.all(`SELECT * FROM quotes`).then(rows => {
    bot.info(`Lade insgesamt ${rows.length} Zitate.`);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].type === 'text') {
        bot.internal.quotes.set(`${rows[i].guild}|${rows[i].id}`, {
          color: rows[i].color,
          fields: [
            {
              name: '\u200b',
              value: rows[i].description,
            },
          ],
          footer: { text: `${rows[i].name} | ${rows[i].id}`, icon_url: rows[i].icon_url },
        });
      } else if (rows[i].type === 'img') {
        bot.internal.quotes.set(`${rows[i].guild}|${rows[i].id}`, {
          color: rows[i].color,
          description: rows[i].description,
          footer: {
            text: `${rows[i].name} | ${rows[i].id}`,
            icon_url: rows[i].icon_url,
          },
          type: 'image',
          image: { url: rows[i].img },
        });
      }
    }
    resolve();
  }).catch((error) => {
    reject(error);
  });
});
