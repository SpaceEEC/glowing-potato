module.exports = class Command {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line consistent-return
    if (!params[1] || !['disable', 'enable'].includes(params[0])) {
      return msg.channel.sendMessage('Fehlender Parameter oder ungültige Operation');
    }
    let cmd;
    if (this.bot.commands.has(params[1])) {
      cmd = params[1];
    } else if (this.bot.aliases.has(params[1])) {
      cmd = this.bot.commands.get(this.bot.aliases.get(params[1])).help.name;
    }
    if (['abgespaced', 'Adminstuff', 'Allgemeines'].includes(this.bot.commands.get(params[1]).conf.group)) {
      return msg.channel.sendMessage(`Dieser Befehl kann nicht deaktiviert werden.`);
    }
    if (params[0] === 'disable') {
      return this.bot.internal.config.add(this.bot, msg, 'disabledcommands', cmd)
        .then(() => {
          msg.channel.sendMessage(`Der Befehl \`${cmd}\` wurde Erfolgreich deaktiviert.`);
        })
        .catch(e => msg.channel.sendMessage(e));
    }
    if (params[0] === 'enable') {
      return this.bot.internal.config.remove(this.bot, msg, 'disabledcommands', cmd)
        .then(() => {
          msg.channel.sendMessage(`Der Befehl \`${cmd}\` wurde Erfolgreich aktiviert.`);
        })
        .catch(e => msg.channel.sendMessage(e));
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['cmd'],
      permLevel: 10,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'command',
      shortdescription: 'Befehlsverwaltung',
      description: 'Ermöglicht dass gildenweite aktivieren oder deaktiveren von Befehlen.',
      usage: '$conf.prefixcommand <disable|enable> [Befehl]',
    };
  }
};
