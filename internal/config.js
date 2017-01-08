exports.get = (bot, msg, key) => new Promise((resolve, reject) => { // eslint-disable-line
  let value = bot.confs.get(msg.guild.id)[key];
  if (value) {
    if (value instanceof Array) {
      let response;
      if (bot.channels.has(value[0])) {
        response = `\n${value.map(v => bot.channels.get(v)).join('\n')}`;
      } else if (bot.users.has(value[0])) {
        response = `\n${value.map(v => bot.users.get(v)).join('\n')}`;
      } else if (msg.guild.roles.has(value[0])) {
        response = `\n${value.map(v => msg.guild.roles.get(v)).join('\n')}`;
      }
      if (value[1]) resolve(`Auf der Liste \`${key}\` stehen: ${response}`);
      else if (value[0]) resolve(`Auf der Liste \`${key}\` steht: ${response.split('\n').join(' ')}`);
      else resolve(`Die Liste \`${key}\` ist leer.`);
    } else {
      if (bot.channels.has(value)) value = bot.channels.get(value);
      if (bot.users.has(value)) value = bot.users.get(value);
      if (msg.guild.roles.get(value)) value = msg.guild.roles.get(value);
      resolve(`Der Wert von \`${key}\` beträgt: ${value}`);
    }
  } else if (key in bot.confs.get(msg.guild.id)) {
    resolve(`Der Wert \`${key}\` ist nicht definiert, also leer.`);
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.set = (bot, msg, key, params) => new Promise((resolve, reject) => { // eslint-disable-line
  if (key in bot.confs.get(msg.guild.id)) {
    let value;
    if (msg.mentions.roles.size !== 0) value = msg.mentions.roles.first().id;
    if (msg.mentions.channels.size !== 0) value = msg.mentions.channels.first().id;
    if (!(params instanceof Array)) value = params;
    if (!value) value = params.slice(2).join(' ');
    bot.confs.get(msg.guild.id)[key] = value;
    bot.log(`UPDATE confs SET ${key}='${value}' WHERE id=${msg.guild.id}`);
    bot.db.run(`UPDATE confs SET '${key}'=? WHERE id=?`, [value, msg.guild.id]).then(() => {
      resolve(`Der Wert \`${key}\` wurde auf \`${value}\` gesetzt.`);
    });
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.reset = (bot, msg, key) => new Promise((resolve, reject) => { // eslint-disable-line
  if (key in bot.confs.get(msg.guild.id)) {
    let value = bot.confs.get('default')[key];
    bot.confs.get(msg.guild.id)[key] = value;
    if (value instanceof Array) value = JSON.stringify(value);
    bot.log(`UPDATE confs SET ${key}='${value}' WHERE id=${msg.guild.id}`);
    bot.db.run(`UPDATE confs SET '${key}'=? WHERE id=?`, [value, msg.guild.id]).then(() => {
      resolve(`Der Wert \`${key}\` wurde zurückgesetzt.`);
    });
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.add = (bot, msg, key, value) => new Promise((resolve, reject) => {
  if (key in bot.confs.get(msg.guild.id)) {
    if (bot.confs.get(msg.guild.id)[key] && bot.confs.get(msg.guild.id)[key].includes(value)) {
      reject(`Der Eintrag \`${value}\` befindet sich bereits in der Liste \`${key}\`.`);
      return;
    }
    if (!bot.confs.get(msg.guild.id)[key]) bot.confs.get(msg.guild.id)[key] = [];
    bot.confs.get(msg.guild.id)[key].push(value);
    bot.log(`UPDATE confs SET ${key}='${JSON.stringify(bot.confs.get(msg.guild.id)[key])}' WHERE id=${msg.guild.id}`);
    bot.db.run(`UPDATE confs SET '${key}'=? WHERE id=?`,
    [JSON.stringify(bot.confs.get(msg.guild.id)[key]), msg.guild.id])
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  } else {
    reject(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.remove = (bot, msg, key, value) => new Promise((resolve, reject) => { // eslint-disable-line
  if (key in bot.confs.get(msg.guild.id)) {
    if (!bot.confs.get(msg.guild.id)[key]) {
      reject(`Die Liste \`${key}\` ist bereits leer.`);
      return;
    } else if (!bot.confs.get(msg.guild.id)[key].includes(value)) {
      reject(`Der Eintrag \`${value}\` befindet sich nicht in der Liste \`${key}\`.`);
      return;
    }
    bot.confs.get(msg.guild.id)[key].splice(bot.confs.get(msg.guild.id)[key].indexOf(value), 1);
    bot.log(`UPDATE confs SET ${key}='${JSON.stringify(bot.confs.get(msg.guild.id)[key])}' WHERE id=${msg.guild.id}`);
    bot.db.run(`UPDATE confs SET '${key}'=? WHERE id=?`,
    [JSON.stringify(bot.confs.get(msg.guild.id)[key]), msg.guild.id])
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  } else {
    reject(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.init = (bot) => new Promise((resolve, reject) => {
  bot.db.all('SELECT * FROM confs').then((guilds) => {
    bot.log(`Lade insgesamt ${guilds.length} Gilden.`);
    for (let i = 0; i < guilds.length; i++) {
      const guild = guilds[i];
      bot.log(`Lade Gilde ${guild.id} | ${guild.name}`);
      try {
        guild.ignchannels = JSON.parse(guild.ignchannels);
        guild.ignusers = JSON.parse(guild.ignusers);
        guild.disabledcommands = JSON.parse(guild.disabledcommands);
      } catch (e) {
        bot.err(e.stack ? e.stack : e);
      }
      bot.confs.set(guild.id, guild);
    }
    resolve();
  }).catch((e) => reject(e));
});
