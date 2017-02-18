module.exports = class Ignore {
  constructor(bot) {
    this.bot = bot;
  }
  async run(msg, params) {
    if (!params[0]) {
      const message = await msg.channel.sendEmbed({
        description: 'Gib den zu Ignorierenden Nutzer/Channel per @Mention, #Channel oder per ID an.',
        color: msg.member.highestRole.color,
        fields: [{
          name: '\u200b',
          value: 'Um diese Anfrage abzubrechen gib `cancel` ein oder lass einfach 30 Sekunden verstreichen.',
        }],
      });
      const collected = (await msg.channel.awaitMessages(m => msg.author.id === m.author.id, { maxMatches: 1, time: 30000 })).first();
      message.delete();
      if (!collected) {
        msg.delete();
      } else if (collected.content === 'cancel') {
        msg.delete();
        collected.delete();
      } else {
        collected.conf = msg.conf;
        this.ignore(collected, collected.content.split(' '));
      }
    } else if (params[0] === 'channels') {
      msg.channel.sendMessage(await this.bot.internal.config.get(this.bot, msg, 'ignchannels'));
    } else if (params[0] === 'users') {
      msg.channel.sendMessage(await this.bot.internal.config.get(this.bot, msg, 'ignusers'));
    } else {
      this.ignore(msg, params);
    }
  }


  async ignore(msg, params) {
    let type;
    let value;
    if (msg.mentions.users.size !== 0) {
      type = 'user';
      value = msg.mentions.users.first();
    } else if (msg.mentions.channels.size !== 0) {
      type = 'channel';
      value = msg.mentions.channels.first();
    } else if (this.bot.users.has(params[0])) {
      type = 'user';
      value = this.bot.users.get(params[0]);
    } else if (this.bot.channels.has(params[0])) {
      type = 'channel';
      value = this.bot.channels.get(params[0]);
    } else {
      msg.channel.sendMessage('Die angegebene ID ist ungültig.');
    }
    if (type === 'user') {
      if (value.bot) {
        msg.channel.sendMessage('Bots können nicht auf die Ignorelist gesetzt werden, da sie ohnehin ignoriert werden.');
      } else if (value.id === msg.guild.owner.id) {
        msg.channel.sendMessage('Den Owner der Gilde ist nicht auf die Ignorelist zu setzen.');
      } else if (value.id === msg.author.id) {
        msg.channel.sendMessage('Dich selber kannst du nicht auf die Ignorelist setzen.');
      } else if (value.id === this.bot.config.ownerID) {
        msg.channel.sendMessage('Diese Person kann nicht auf die Ignorelist gesetzt werden.');
      } else if (msg.conf.ignusers && msg.conf.ignusers.includes(value.id)) {
        await this.bot.internal.config.remove(this.bot, msg, 'ignusers', value.id);
        msg.channel.sendMessage(`Der Nutzer ${this.bot.users.get(value.id)} wird jetzt nicht mehr in dieser Gilde von diesem Bot ignoriert.`);
      } else {
        this.bot.internal.config.add(this.bot, msg, 'ignusers', value.id);
        msg.channel.sendMessage(`Der Nutzer ${this.bot.users.get(value.id)} wird jetzt in dieser Gilde von diesem Bot ignoriert.`);
      }
    } else if (type === 'channel') {
      if (msg.conf.ignchannels && msg.conf.ignchannels.includes(value.id)) {
        await this.bot.internal.config.remove(this.bot, msg, 'ignchannels', value.id);
        msg.channel.sendMessage(`Der Channel ${this.bot.channels.get(value.id)} wird jetzt nicht mehr ignoriert.`);
      } else {
        await this.bot.internal.config.add(this.bot, msg, 'ignchannels', value.id);
        msg.channel.sendMessage(`Der Channel ${this.bot.channels.get(value.id)} wird jetzt ignoriert.`);
      }
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['ign'],
      permLevel: 10,
    };
  }


  static get help() {
    return {
      name: 'ignore',
      shortdescription: 'Ignorelist',
      description: 'Dieser Befehl ermöglicht das Ignorieren von Nutzern und Channeln, sowie das Unignorieren dieser.',
      usage: '$conf.prefixignore <@mention|#channel|ID>\n$conf.prefixignore <users|channels>',
    };
  }
};
