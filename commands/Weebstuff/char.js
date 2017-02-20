const request = require('superagent');

module.exports = class Char {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (!params[0]) {
      const mes = await msg.channel.sendEmbed({
        title: 'Ein kleines Missgeschick',
        description: `\u200b
Einen Charakter suchen wir heute?
Ein Vor- oder Nachname würde mir reichen.`,
        fields: [
          {
            name: `\u200b`,
            value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
          }],
        color: msg.member.highestRole.color,
      });
      try {
        const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
        mes.delete();
        if (!collected) return msg.delete();
        if (collected.content === 'cancel') {
          collected.first().delete();
          return msg.delete();
        } else {
          if (collected.content.includes('?')) {
            return msg.channel.sendEmbed(
              new this.bot.methods.Embed()
                .setColor(0xffff00)
                .setDescription('Bitte keine Fragezeichen verwenden, die Anfrage würde dadurch ungültig werden.')
            );
          }
          return this.authcheck(msg, collected.content.split(' '));
        }
      } catch (e) {
        mes.delete();
        return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
      }
    }
    if (params.join(' ').includes('?')) {
      return msg.channel.sendEmbed(
        new this.bot.methods.Embed()
          .setColor(0xffff00)
          .setDescription('Bitte keine Fragezeichen verwenden, die Anfrage würde dadurch ungültig werden.')
      );
    }
    return this.authcheck(msg, params);
  }


  async authcheck(bot, msg, params) {
    if (this.bot.config.ani_expires <= Math.floor(Date.now() / 1000) + 300) {
      const message = await msg.channel.sendEmbed(
        new this.bot.methods.Embed()
          .setColor(0xffff00)
          .setDescription('Der Token ist ausgelaufen, ich fordere einen neuen an.\nDies kann einen Moment dauern, ich bitte um Geduld.'));
      const res = await request.post(`https://anilist.co/api/auth/access_token`)
        .send({
          grant_type: 'client_credentials',
          client_id: this.bot.internal.auth.anilist.client_id,
          client_secret: this.bot.internal.auth.anilist.client_secret,
        })
        .set('Content-Type', 'application/json');
      this.bot.config.ani_token = res.body.access_token;
      this.bot.config.ani_expires = res.body.expires;
      this.bot.debug(`[char] UPDATE config SET ani_expires=${res.body.expires}, ani_token=${res.body.access_token};`);
      await this.bot.db.run(`UPDATE config SET ani_expires=?, ani_token=?;`, [res.body.expires, res.body.access_token]);
      // await this.bot.db.run(`UPDATE config SET ani_token=?`, []);
      // await this.bot.db.run("UPDATE 'config' SET 'ani_expires'=? AND 'ani_token'=?; WHERE true", [res.body.expires, res.body.access_token]);
      await message.edit({
        embed: new this.bot.methods.Embed()
          .setColor(0x00ff08)
          .setDescription('Token wurde erfolgreich erneuert.'),
      });
      return this.query(params.join(' '), msg, bot);
    } else {
      return this.query(params.join(' '), msg, bot);
    }
  }


  async query(search, msg, bot) {
    const res = await request.get(`https://anilist.co/api/character/search/${search}?access_token=${this.bot.config.ani_token}`)
      .send(null)
      .set('Content-Type', 'application/json');
    let response;
    response = JSON.parse(res.text);
    if (response.error) {
      if (response.error.messages[0] === 'No Results.') {
        return msg.channel.sendEmbed(
          new this.bot.methods.Embed()
            .setColor(0xffff00)
            .setDescription(`Leider keinen Charakter auf diese Anfrage gefunden.`)
            .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
      } else {
        return msg.channel.sendEmbed(
          new this.bot.methods.Embed()
            .setColor(0xffff00)
            .setTitle('Unerwarteter Fehler:')
            .setDescription(`Sowas sollte nicht passieren.
Bitte kontaktiere \`${this.bot.config.owner}\`\n\n${response.error.messages[0]}`)
            .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
      }
    } else if (!response[1]) {
      return this.answer(response[0], msg, bot);
    } else {
      return this.getanswer(bot, msg, response);
    }
  }


  async getanswer(bot, msg, response) { // eslint-disable-line consistent-return
    let count = 1;
    const message = await msg.channel.sendEmbed(
      new this.bot.methods.Embed()
        .setColor(msg.guild.member(msg.author).highestRole.color)
        .setTitle(`Es gibt mehrere Charaktere auf diese Suchanfrage:`)
        .setDescription(response.map(r => `${count++}\t\t${r.name_first} ${r.name_last ? r.name_last : ''}`).join('\n'))
        .addField(`Gib die Nummer des Charakters, für den weitere Informationen haben möchtest an.`,
        'Diese Anfrage wird bei `cancel` oder nach `30` Sekunden automatisch abgebrochen.'));
    try {
      const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      message.delete();
      if (!collected) return msg.delete();
      if (collected.content === 'cancel') {
        msg.delete();
        collected.first().delete();
        message.delete();
      } else if (collected.content % 1 !== 0 || !response[parseInt(collected.content) - 1]) {
        collected.first().delete();
        message.delete();
        this.getanswer(bot, msg, response);
      } else {
        collected.first().delete();
        this.answer(response[parseInt(collected.content) - 1], msg, bot, message);
      }
    } catch (e) {
      message.delete();
      return msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
    }
  }


  async answer(response, msg, bot, mes) {
    const map = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'" };
    response.info = response.info.replace(/&([^;]+);/g, (m, c) => map[c])
      .split('`').join('\'').split('<br>').join('\n'); // eslint-disable-line newline-per-chained-call
    const embed = new this.bot.methods.Embed()
      .setColor(0x0800ff)
      .setTitle(`${response.name_first ? response.name_first : ''} ${response.name_last ? response.name_last : ''}`)
      .setDescription(`${response.name_japanese}\n\n${response.name_alt ? `Aliases:\n${response.name_alt}` : ''}`)
      .setThumbnail(response.image_url_med);
    if (response.info.length < 1025) {
      embed.addField('Beschreibung', response.info.length ? response.info : 'Keine Beschreibung angegeben.');
    } else {
      const info = response.info.match(/(.|[\r\n]){1,1024}/g);
      for (let i = 0; i < info.length; i++) {
        embed.addField(i === 0 ? 'Lange Beschreibung' : '\u200b',
          info[i]);
      }
    }
    try {
      if (mes) await mes.edit({ embed });
      else await msg.channel.sendEmbed(embed);
    } catch (e) {
      msg.channel.sendCode('js', `${e}${e && e.response && e.response.res && e.response.res.text ? `\n${this.bot.inspect(JSON.parse(e.response.res.text), false, 1)}` : ''}`);
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['character', 'charakter'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }

  static get help() {
    return {
      name: 'char',
      description: 'Ruft einen Charakter aus der AnilistDB(Animes/Mangas) ab.',
      shortdescription: 'Charaktersuche',
      usage: '$conf.prefixchar [Suchbegriff(e)]',
    };
  }
};
