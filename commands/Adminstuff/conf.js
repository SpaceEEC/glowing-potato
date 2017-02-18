module.exports = class Conf {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params) {
    if (!params[0] || !['get', 'set', 'reset', 'list', 'show'].includes(params[0])) {
      this.menu(msg);
    } else if (params[0] === 'list') {
      msg.channel.sendCode('js', this.bot.inspect(msg.conf));
    } else if (!params[1]) {
      msg.channel.sendMessage('Bitte gib einen Schlüssel an, mit welchem diese Operation ausgeführt werden soll.');
    } else if (params[0] === 'get') {
      msg.channel.sendMessage(await this.bot.internal.config.get(this.bot, msg, params[1]));
    } else if (params[0] === 'reset') {
      if (['id'].includes(params[1])) msg.channel.sendMessage('Dieser Schlüssel kann nicht zurückgesetzt werden.');
      else if (params[1] === 'name') msg.channel.sendMessage(await this.bot.internal.config.set(this.bot, msg, params[1], msg.guild.name));
      else msg.channel.sendMessage(await this.bot.internal.config.reset(this.bot, msg, params[1]));
    } else if (params[0] === 'set') {
      if (['ignchannels', 'ignusers'].includes(params[1])) {
        msg.channel.sendMessage(`Zum Ignorieren von Nutzern oder Channeln bitte \`${msg.conf.prefix}ignore\` verwenden.`);
      } else if (params[1] === 'disabledcommands') {
        msg.channel.sendMessage(`Zum Deaktivieren von Befehlen bitte \`${msg.conf.prefix}command\` verwenden.`);
      } else if (params[1] === 'id') {
        msg.channel.sendMessage('Die `id` ist auf dem neusten Stand.');
      } else if (params[1] === 'name') {
        msg.channel.sendMessage(await this.bot.internal.config.set(this.bot, msg, params[1], msg.guild.name));
      } else {
        msg.channel.sendMessage(await this.bot.internal.config.set(this.bot, msg, params[1], params.slice(2)));
      }
    }
  }


  menu(msg) {
    let options = new this.bot.methods.Collection();
    let c = 1;
    for (let key in msg.conf) {
      if (msg.conf.hasOwnProperty(key)) {
        if (!['id', 'name', 'ignchannels', 'ignusers', 'disabledcommands'].includes(key)) {
          options.set(c.toString(), key);
          c++;
        }
      }
    }
    let embed = {
      color: 0x0000FF,
      title: 'Konfigurationsmenü',
      description: `Welchen Wert wünscht du zu ändern?\n\n${options
        .keyArray()
        .map(k => `${k}. ${options.get(k)} - \`${msg.conf[options.get(k)]
          ? msg.conf[options.get(k)].length === 0
            ? '[]'
            : msg.conf[options.get(k)]
          : msg.conf[options.get(k)]}\``)
        .join('\n')}`,
      fields: [
        {
          name: 'Einfach den Namen oder die Zahl des zu ändernden Objektes angeben.',
          value: 'Zum Abbrechen `cancel` eingeben, oder einfach `30` Sekunden warten.',
        },
      ],
    };
    this.sendconf(msg, embed, options);
  }


  async sendconf(msg, embed, options) {
    const mes = await msg.channel.sendEmbed(embed);
    const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
    mes.delete();
    if (!collected) {
      msg.delete();
    } else if (collected.content === 'cancel') {
      msg.delete();
    } else if (options.has(collected.content)) {
      collected.delete();
      collected.content = options.get(collected.content);
      this.sendvalue(msg, collected.content);
    } else if (!(collected.content in msg.conf)) {
      collected.delete();
      embed.fields[1] = {
        name: 'Diese Eingabe ist ungültig.',
        value: '\u200b',
      };
      this.sendconf(msg, embed, options);
    }
  }


  async sendvalue(msg, key) {
    const _key = await this.bot.internal.config.get(this.bot, msg, key);
    const mes = await msg.channel.sendMessage(_key, {
      embed: {
        color: 0x0000ff,
        fields: [{
          name: 'Bitte einen neuen Wert für diesen Schlüssel eingeben.',
          value: 'Je nach Schlüssel sind ein Text oder die ID (@Mentions oder #Channel sind auch möglich) gültige Werte.'
          + '\n\u200b'
          + '\nZum Löschen `reset` eingeben.'
          + '\nZum Abbrechen `cancel` eingeben.',
        }],
      },
    });
    const collected = (await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { mes: msg, maxMatches: 1, time: 30000 })).first();
    mes.delete();
    if (!collected) {
      msg.delete();
    } else if (collected.content === 'cancel') {
      collected.delete();
      msg.delete();
    } else if (collected.content === 'reset') {
      msg.channel.sendMessage(await this.bot.internal.config.reset(this.bot, collected, key));
    } else {
      msg.channel.sendMessage(await this.bot.internal.config.set(this.bot, collected, key, collected.content.split(' ')));
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['config'],
      permLevel: 10,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'conf',
      shortdescription: 'Konfiguration',
      description: 'Mit diesem Befehl ist es möglich den Bot auf dieser Gilde zu konfigurieren.',
      usage: '$conf.prefixconf menu - Interaktives Menü'
      + '\n$conf.prefixconf <list|show> - Zeigt die Konfiguration an.'
      + '\n$conf.prefixconf <get|reset> [Key]'
      + '\n$conf.prefixconf <set> [Key] [Value]',
    };
  }
};
