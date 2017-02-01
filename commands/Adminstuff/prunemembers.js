exports.run = async (bot, msg, params = []) => {
  let days;
  if (!params[0]) {
    const mes = await msg.channel.sendMessage('Wir kicken heute also inaktive Member?\nVon wie vielen Tagen der Inaktivität sprechen wir hier denn?');
    const collected = await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1, errors: ['time'] })
      .catch(() => {
        msg.delete();
        mes.delete();
      });
    mes.delete();
    days = parseInt(collected.first().content.split(' ')[0]);
    if (!days) {
      return msg.channel.sendMessage('Bei dieser Eingabe handelt es sich um keine gültige Zahl!');
    }
  }
  const count = await msg.guild.pruneMembers(days, true);
  const mes = await msg.channel.sendMessage(`Das wären dann ${count} Member welche gekickt werden sollen.\nIst das korrekt? (__j__a/__y__es oder __n__ein/__n__o)`);
  const collected = await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { time: 30000, maxMatches: 1, errors: ['time'] })
    .catch(() => {
      msg.delete();
      mes.delete();
    });
  mes.delete();
  if (['ja', 'yes', 'j', 'y'].includes(collected.first().content.content.split(' ')[0])) {
    const kicked = await msg.guild.pruneMembers(days);
    return msg.channel.sendMessage(`Es wurden erfolgreich ${kicked} Member gekickt!`);
  } else if (['nein', 'no', 'n'].includes(collected.first().content.content.split(' ')[0])) {
    return msg.channel.sendMessage('Breche den Vorgang dann, wie gewünscht, ab.');
  } else {
    return msg.channel.sendMessage('Konnte diese Eingabe nicht eindeutig zuordnen, breche den Vorgang daher vorsichtshabler ab.');
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 11,
};


exports.help = {
  name: 'prunemembers',
  shortdescription: 'Member kicken',
  description: 'Kickt alle Member, welche keine Rolle haben und `n` Tage inaktiv waren.',
  usage: '$conf.prefixprunemembers [Tage]',
};
