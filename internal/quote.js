exports.add = async (bot, guild, type, id, color, name, icon_url, description, img) => {
  if (type === 'text') {
    bot.info(`[quote] INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (${guild}, ${type}, ${id}, ${color}, ${name}, ${icon_url}, ${description}, ${null})`);
    await bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      guild, type, id, color, name, icon_url, description, null]);
    bot.internal.quotes.set(`${guild}|${id}`, {
      color: color,
      description: description,
      footer: { text: `${name} | ${id}`, icon_url: icon_url },
    });
  } else if (type === 'img') {
    bot.info(`[quote] INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (${guild}, ${type}, ${id}, ${color}, ${name}, ${icon_url}, ${description}, ${img})`);
    await bot.db.run(`INSERT INTO "quotes" (guild, type, id, color, name, icon_url, description, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      guild, type, id, color, name, icon_url, description, img]);
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
  }
};

exports.remove = async (bot, guild, id) => {
  await bot.db.run('DELETE FROM quotes WHERE guild=? AND id=?', [guild, id]);
  bot.internal.quotes.delete(`${guild}|${id}`);
};

exports.init = async (bot) => {
  bot.internal.quotes = new bot.methods.Collection();
  const rows = await bot.db.all(`SELECT * FROM quotes`);
  bot.info(`Lade insgesamt ${rows.length} Zitate.`);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].type === 'text') {
      bot.internal.quotes.set(`${rows[i].guild}|${rows[i].id}`, {
        color: rows[i].color,
        description: rows[i].description,
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
};
