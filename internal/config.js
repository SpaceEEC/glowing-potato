exports.get = (bot, msg, key) => new Promise((resolve, reject) => { // eslint-disable-line
  const conf = bot.confs.get(msg.guild.id);
  let value = conf[key];
  if (value) {
    if (value instanceof Array) {
      if (bot.channels.has(value[0])) {
        value = `\n${value.map(v => bot.channels.get(v).join('\n'))}`;
      } else if (bot.users.has(value[0])) {
        value = `\n${value.map(v => bot.users.get(v).join('\n'))}`;
      } else if (msg.guild.roles.has(value[0])) {
        value = `\n${value.map(v => msg.guild.roles.get(v).join('\n'))}`;
      }
      if (value[1]) resolve(`Die Werte von \`${key}\` betragen: ${value}`);
      else resolve(`Der Wert von \`${key}\` beträgt: ${value}`);
    } else {
      if (bot.channels.has(value)) value = bot.channels.get(value);
      if (bot.users.has(value)) value = bot.users.get(value);
      if (msg.guild.roles.get(value)) value = msg.guild.roles.get(value);
      resolve(`Der Wert von \`${key}\` beträgt: ${value}`);
    }
  } else if (key in conf) {
    resolve(`Der Wert \`${key}\` ist nicht definiert.`);
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.set = (bot, msg, key, params) => new Promise((resolve, reject) => { // eslint-disable-line
  const conf = bot.confs.get(msg.guild.id);
  if (key in conf) {
    let value;
    if (msg.mentions.roles.size !== 0) value = msg.mentions.roles.first().id;
    if (msg.mentions.channels.size !== 0) value = msg.mentions.channels.first().id;
    if (!(params instanceof Array)) value = params;
    if (!value) value = params.slice(2).join(' ');
    bot.confs.get(msg.guild.id)[key] = value;
    bot.db.run(`UPDATE confs SET ${key}='${value}' WHERE id=${msg.guild.id}`).then(() => {
      resolve(`Der Wert \`${key}\` wurde auf \`${value}\` gesetzt.`);
    });
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});


exports.reset = (bot, msg, key) => new Promise((resolve, reject) => { // eslint-disable-line
  const conf = bot.confs.get(msg.guild.id);
  if (key in conf) {
    bot.confs.get(msg.guild.id)[key] = null;
    bot.db.run(`UPDATE confs SET ${key}=NULL WHERE id=${msg.guild.id}`).then(() => {
      resolve(`Der Wert \`${key}\` wurde zurückgesetzt.`);
    });
  } else {
    resolve(`Der Wert \`${key}\` existiert nicht in der Config.`);
  }
});
