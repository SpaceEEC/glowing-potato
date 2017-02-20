module.exports = class Prune {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line consistent-return
    if (!msg.channel.permissionsFor(msg.member).hasPermission('MANAGE_MESSAGES') || !msg.channel.permissionsFor(this.bot.user).hasPermission('MANAGE_MESSAGES')) {
      return msg.channel.sendMessage('Wir beide müssen hier Rechte zum löschen haben. Mindestens einer hat sie nicht.');
    }
    const user = msg.mentions.users.first() || this.bot.users.get(params[0]);
    let amount = parseInt(params.pop());
    if (!amount) return msg.channel.sendMessage('Bitte eine Anzahl an, zu löschender Nachrichten angeben. (Optional auch einen Nutzer)');
    if (user) {
      let messages = (await msg.channel.fetchMessages({ limit: amount }))
        .filter(m => m.author.id === user.id && m.deletable);
      if (!messages.size) return '';
      if (messages.size === 1) await messages.first().delete();
      else await msg.channel.bulkDelete(messages);
    } else if (amount <= 1) {
      await msg.delete();
    } else {
      await msg.channel.bulkDelete(amount);
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 5,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'prune',
      description: 'Löscht die letzten [Anzahl] Nachrichten von (User) aus diesem Channel.',
      shortdescription: 'Tilgt Nachrichten',
      usage: '$conf.prefixprune (User) [Anzahl]',
    };
  }
};
