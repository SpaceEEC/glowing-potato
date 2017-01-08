exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  let permlvl = 1;
  try {
    msg.guild.fetchMember(msg.author).then((member) => {
      const modRole = msg.guild.roles.get(msg.conf.modRole);
      if (modRole && member.roles.has(modRole.id)) {
        permlvl = 5;
      }
      const adminRole = msg.guild.roles.get(msg.conf.adminRole);
      if (adminRole && member.roles.has(adminRole.id)) {
        permlvl = 10;
      }
      /* const users = bot.confs.get(msg.guild.id).users;
      if (users[msg.author.id]) {
        if (permlvl < users[msg.author.id].pp) {
          permlvl = users[msg.author.id].pp;
        }
      } */
      if (member === msg.guild.owner) {
        permlvl = 11;
      }
      if (msg.author.id === bot.config.ownerID) {
        permlvl = 12;
      }
      msg.permlvl = permlvl;
      check(bot, permlvl, cmd)
        .then(() => {
          resolve(permlvl);
        })
        .catch((e) => {
          reject(e);
        });
    });
  } catch (e) {
    reject(e);
  }
});
exports.conf = {
  spamProtection: false,
  enabled: true,
};


const check = (bot, permlvl, cmd) => new Promise((resolve, reject) => {
  if (permlvl >= cmd.conf.permLevel) {
    resolve();
  } else {
    reject(`Du darfst den Befehl \`${cmd.help.name}\` leider nicht verwenden.`);
  }
});

