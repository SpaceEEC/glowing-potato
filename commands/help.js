exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0] || params[0] === 'all') {
    let stuff = [];
    let notall = false;
    if (params[0]) {
      if (params[0] === 'all') {
        bot.commands.forEach((item, key, mapObj) => { // eslint-disable-line
          const cmd = bot.commands.get(key);
          if (!stuff[cmd.conf.group]) {
            stuff[cmd.conf.group] = [`${cmd.help.name}\` - ${cmd.help.shortdescription
              .split('$conf.prefix').join(msg.conf.prefix)}`];
          } else {
            let temp = stuff[cmd.conf.group];
            temp.push(`${cmd.help.name}\` - ${cmd.help.shortdescription.split('$conf.prefix').join(msg.conf.prefix)}`);
            stuff[cmd.conf.group] = temp;
          }
        });
      }
    } else {
      bot.commands.forEach((item, key, mapObj) => { // eslint-disable-line
        const cmd = bot.commands.get(key);
        if (!msg.conf.disabledcommands.includes(cmd.help.name)) {
          if (msg.permlvl > parseInt(cmd.conf.permLevel) - 1) {
            if (!stuff[cmd.conf.group]) {
              stuff[cmd.conf.group] = [`${cmd.help.name}\` - ${cmd.help.shortdescription
                .split('$conf.prefix').join(msg.conf.prefix)}`];
            } else {
              let temp = stuff[cmd.conf.group];
              temp.push(`${cmd.help.name}\` - ${cmd.help.shortdescription
                .split('$conf.prefix').join(msg.conf.prefix)}`);
              stuff[cmd.conf.group] = temp;
            }
          } else if (cmd.conf.group !== 'abgespaced') {
            if (!notall) {
              notall = true;
            }
          }
        }
      });
    }
    if (msg.permlvl !== 12) {
      delete stuff.abgespaced;
    }
    // Löschen der 'abgespaced' Befehle, cause Reasons.
    const response = new bot.methods.Embed();
    response.setColor(3447003)
      .setTitle('Folgende Befehle stehen dir zur Verfügung:')
      .setDescription('\u200b')
      .setThumbnail(bot.user.avatarURL)
      .setFooter(msg.content, msg.author.avatarURL)
      .setTimestamp();
    for (let kat in stuff) {
      if (stuff.hasOwnProperty(kat)) {
        response.addField(`${kat}:`, `\`${msg.conf.prefix}${stuff[kat].join(`\n\`${msg.conf.prefix}`)}`, true);
      }
    }
    response.addField('Für weitere Informationen zu den einzelnen Befehlen:',
      `Verwende: \`${msg.conf.prefix}help [Befehl]\``);
    if (notall) {
      response.addField('Zum Anzeigen aller Befehle',
        `Auch diese, zu denen du keine Rechte hast.\nVerwende \`${msg.conf.prefix}help all\``, false);
    }
    return msg.channel.sendEmbed(response);
  }
  if (params[1]) {
    // Zu viele Parameter
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Zu viele Parameter',
      'Bitte gib nur einen Befehl zur Zeit an.')
      .setFooter(msg.content, msg.author.avatarURL)
    );
  }
  if (params[0].startsWith(msg.conf.prefix)) {
    params[0] = params[0].replace(msg.conf.prefix, '');
  }
  let com;
  let alias = false;
  if (!bot.commands.has(params[0])) {
    if (bot.aliases.has(params[0])) {
      alias = true;
      com = bot.aliases.get(params[0]);
    } else {
      return msg.channel.sendembed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Fehlerhafter Parameter',
        `Der Befehl \`${params[0]}\` existiert nicht. Vielleicht vertippt?`)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL));
    }
  } else { com = params[0]; }
  const cmd = bot.commands.get(com);
  var aliases = '';
  bot.aliases.forEach((item, key, mapObj) => { // eslint-disable-line
    if (bot.aliases.get(key) === com) {
      aliases += `\`${msg.conf.prefix + key.toString()}\` `;
    }
  });
  msg.channel.sendEmbed({
    color: 3447003,
    description: alias ?
      `Der Befehl \`${msg.conf.prefix + params[0]}\` ist ein Alias von \`${msg.conf.prefix + cmd.help.name}\`.` :
      undefined,
    fields: [
      {
        name: `Der Befehl \`${msg.conf.prefix + cmd.help.name}\` hat folgende Funktion:`,
        value: cmd.help.description,
      },
      {
        name: `Der Befehl \`${msg.conf.prefix + cmd.help.name}\` hat folgende Aliasse`,
        value: aliases.length === 0 ? 'Dieser Befehl hat keine Aliasse.' : aliases,
        inline: true,
      },
      {
        name: `Benötigtes Permissionlevel`,
        value: `❯ ${cmd.conf.permLevel}`,
        inline: true,
      },
      {
        name: `Der Befehl \`${msg.conf.prefix + cmd.help.name}\` wird folgendermaßen angewandt:`,
        value: cmd.help.usage.split('$conf.prefix').join(msg.conf.prefix),
        inline: false,
      },
      {
        name: 'Generell für Argumente:',
        value: '<> heißt, dass eins davon genommen werden muss.\n[] heißt, dass das Argument zwingend erforderlich ist.\n() heißt, dass das Argument weggelassen werden kann.', // eslint-disable-line
      },
    ],
    footer: {
      icon_url: bot.user.avatarURL,
      text: `${msg.author.username}: ${msg.content}`,
    },
  });
});


exports.conf = {
  group: 'Allgemeines',
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};

exports.help = {
  name: 'help',
  description: 'Zeigt eine Liste der verfügbaren Befehl an oder die Hilfe für einen einzelnen Befehl.',
  shortdescription: 'Dieser Befehl',
  usage: '$conf.prefixhelp\n$conf.prefix [Befehl]',
};
