exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  const kickmembers = msg.guild.members.filter(m => m.roles.size === 1);
  if (kickmembers.size === 0) {
    return msg.channel.sendMessage('Es gibt keine Member ohne mindestens eine Rolle auf diesem Server hier.');
  }
  msg.channel.sendMessage(`Kicke ${kickmembers.size} Member ohne Rollen.`);
  const kicks = [true];
  kickmembers.map((m) => kicks.push(m.kick()));
  Promise.all(kicks).then(() => {
    msg.channel.sendMessage(`${kickmembers.size} Member gekickt.`);
  }, (reason) => {
    msg.channel.sendMessage(`Fehler beim kicken:\n\n\`\`\`js\n${reason}\`\``);
  });
});


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 11,
};


exports.help = {
  name: 'prunemembers',
  shortdescription: 'Member kicken',
  description: 'Kickt alle Member, welche keine Rolle haben.',
  usage: '$conf.prefixprunemembers',
};
