module.exports = class Help {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0] || params[0] === 'all') this.all(msg, params);
    else this.one(msg, params);
  }


  one(msg, params) { // eslint-disable-line consistent-return
    if (params[0].startsWith(msg.conf.prefix)) params[0] = params[0].replace(msg.conf.prefix, '');
    let com;
    let alias = false;
    // eslint doesn't complain about that /shrug
    if (this.bot.commands.has(params[0])) { com = params[0]; } else
      if (this.bot.aliases.has(params[0])) {
        alias = true;
        com = this.bot.aliases.get(params[0]);
      } else {
        return msg.channel.sendEmbed(new this.bot.methods.Embed()
          .setColor(0xff0000)
          .addField('Fehlerhafter Parameter',
          `Der Befehl \`${params[0]}\` existiert nicht. Vielleicht vertippt?`)
          .setFooter(`${msg.author.username}: ${msg.content}`, this.bot.user.avatarURL));
      }
    const cmd = this.bot.commands.get(com);
    let aliases = '';
    this.bot.aliases.forEach((item, key) => {
      if (this.bot.aliases.get(key) === com) {
        aliases += `\`${msg.conf.prefix + key.toString()}\` `;
      }
    });
    msg.channel.sendEmbed({
      color: 3447003,
      description: alias
        ? `Der Befehl \`${msg.conf.prefix + params[0]}\` ist ein Alias von \`${msg.conf.prefix + cmd.help.name}\`.`
        : undefined,
      fields: [
        {
          name: `Der Befehl \`${msg.conf.prefix + cmd.help.name}\` hat folgende Funktion:`,
          value: cmd.help.description.split('$conf.prefix').join(msg.conf.prefix),
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
          value: '`<>` heißt, dass eins davon so wie es ist genommen werden muss.\n'
          + '`[]` heißt, dass das Argument zwingend erforderlich ist und mit dem entsprechendem Einsatz ersetzt werden muss.\n'
          + '`()` heißt, dass das Argument weggelassen werden kann und mit dem entsprechendem Einsatz ersetzt werden muss.',
        },
      ],
      footer: {
        icon_url: this.bot.user.avatarURL,
        text: `${msg.author.username}: ${msg.content}`,
      },
    });
  }


  all(msg, params) {
    let stuff = [];
    let notall = false;
    if (params[0]) {
      if (params[0] === 'all') {
        this.bot.commands.forEach((item, key) => {
          const cmd = this.bot.commands.get(key);
          if (cmd.help.shortdescription.length !== 0) {
            if (!stuff[cmd.conf.group]) {
              stuff[cmd.conf.group] = [`${cmd.help.name}\` - ${cmd.help.shortdescription
                .split('$conf.prefix').join(msg.conf.prefix)}`];
            } else {
              let temp = stuff[cmd.conf.group];
              temp.push(`${cmd.help.name}\` - ${cmd.help.shortdescription.split('$conf.prefix').join(msg.conf.prefix)}`);
              stuff[cmd.conf.group] = temp;
            }
          }
        });
      }
    } else {
      this.bot.commands.forEach((item, key) => {
        const cmd = this.bot.commands.get(key);
        if (cmd.help.shortdescription.length !== 0) {
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
              if (!notall) notall = true;
            }
          }
        }
      });
    }
    if (msg.permlvl !== 12) delete stuff.abgespaced;
    // Löschen der 'abgespaced' Befehle, cause Reasons.
    const response = new this.bot.methods.Embed();
    response.setColor(3447003)
      .setTitle('Folgende Befehle stehen dir zur Verfügung:')
      .setDescription('\u200b')
      .setThumbnail(this.bot.user.avatarURL)
      .setFooter(msg.content, msg.author.avatarURL)
      .setTimestamp();
    stuff = stuff.sort();
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
    msg.channel.sendEmbed(response);
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['halp'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'help',
      description: 'Zeigt eine Liste der verfügbaren Befehl an oder die Hilfe für einen einzelnen Befehl.',
      shortdescription: 'Dieser Befehl',
      usage: '$conf.prefixhelp\n$conf.prefix [Befehl]',
    };
  }
};
