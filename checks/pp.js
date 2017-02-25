exports.run = async (bot, msg, Command) => {
  let permlvl = 1;
  const member = await msg.guild.fetchMember(msg.author);
  if (member.roles.has(msg.conf.modrole)) permlvl = 5;
  if (member.roles.has(msg.conf.adminrole)) permlvl = 10;
  if (member === msg.guild.owner) permlvl = 11;
  if (msg.author.id === bot.config.ownerID) permlvl = 12;
  msg.permlvl = permlvl;
  if (permlvl < Command.conf.permLevel) throw String(`Du darfst den Befehl \`${Command.help.name}\` leider nicht verwenden.`);
};

exports.conf = {
  spamProtection: false,
  enabled: true,
};
