exports.run = (bot, msg, cmd) => new Promise((resolve, reject) => {
  let permlvl = 1;
  msg.guild.fetchMember(msg.author).then((member) => {
    const modrole = msg.guild.roles.get(msg.conf.modrole);
    if (modrole && member.roles.has(modrole.id)) {
      permlvl = 5;
    }
    const adminrole = msg.guild.roles.get(msg.conf.adminrole);
    if (adminrole && member.roles.has(adminrole.id)) {
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
    if (permlvl >= cmd.conf.permLevel) resolve();
    else reject(`Du darfst den Befehl \`${cmd.help.name}\` leider nicht verwenden.`);
  });
});

exports.conf = {
  spamProtection: false,
  enabled: true,
};
