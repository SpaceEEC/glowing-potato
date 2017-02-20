const request = require('superagent');

module.exports = class Anime {
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
Einen Anime suchen wir also... Wonach soll ich suchen?
Ein Teil des Titels würde schon reichen.`,
        fields: [
          {
            name: `\u200b`,
            value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
          }],
        color: msg.member.highestRole.color,
      });
      const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      mes.delete();
      if (!collected) return msg.delete();
      if (collected.content === 'cancel') {
        collected.delete();
        return msg.delete();
      } else {
        return this.authcheck(msg, collected.content.split(' '));
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


  async authcheck(msg, params) {
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
      this.bot.debug(`[anime] UPDATE config SET ani_expires=${res.body.expires}, ani_token=${res.body.access_token};`);
      await this.bot.db.run(`UPDATE config SET ani_expires=?, ani_token=?;`, [res.body.expires, res.body.access_token]);
      await message.edit({
        embed: new this.bot.methods.Embed()
          .setColor(0x00ff08)
          .setDescription('Token wurde erfolgreich erneuert.'),
      });
      return this.query(params.join(' '), msg);
    } else {
      return this.query(params.join(' '), msg);
    }
  }


  async query(search, msg) {
    const res = await request.get(`https://anilist.co/api/${msg.cmd}/search/${search}?access_token=${this.bot.config.ani_token}`)
      .send(null)
      .set('Content-Type', 'application/json');
    let response;
    response = JSON.parse(res.text);
    if (response.error) {
      if (response.error.messages[0] === 'No Results.') {
        return msg.channel.sendEmbed(
          new this.bot.methods.Embed()
            .setColor(0xffff00)
            .setDescription(`Leider keinen ${msg.cmd} auf diese Anfrage gefunden.`)
            .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
      } else {
        return msg.channel.sendEmbed(
          new this.bot.methods.Embed()
            .setColor(0xffff00)
            .setTitle('Unerwarteter Fehler:')
            .setDescription(`Sowas sollte nicht passieren.
Bitte kontaktiere bitte \`${this.bot.config.owner}\`\n\n${response.error.messages[0]}`)
            .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
      }
    } else if (!response[1]) {
      return this.answer(response[0], msg);
    } else {
      return this.getanswer(msg, response);
    }
  }
  async getanswer(msg, response) {
    let count = 1;
    const message = await msg.channel.sendEmbed(
      new this.bot.methods.Embed()
        .setColor(msg.member.color())
        .setTitle(`Es gibt mehrere ${msg.cmd} auf diese Suchanfrage:`)
        .setDescription(response.map(r => `${count++}\t\t${r.title_english}`).join('\n'))
        .addField(`Für welchen ${msg.cmd} darf es denn die Info geben?`,
        'Diese Anfrage wird bei `cancel` oder nach `30` Sekunden automatisch abgebrochen.'));
    try {
      const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
      const input = collected.content;
      if (input === 'cancel') {
        msg.delete();
        collected.delete();
        message.delete();
      } else if (input % 1 !== 0 || !response[parseInt(input) - 1]) {
        collected.delete();
        message.delete();
        this.getanswer(msg, response);
      } else {
        collected.delete();
        this.answer(response[parseInt(input) - 1], msg, message);
      }
    } catch (e) {
      message.delete();
      msg.channel.sendMessage('Breche die Anfrage wie, durch die inaktivität gewünscht, ab.');
    }
  }


  answer(response, msg, mes) {
    const map = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'" };
    response.description = response.description.replace(/&([^;]+);/g, (m, c) => map[c])
      .split('`').join('\'').split('<br>').join('\n'); // eslint-disable-line newline-per-chained-call
    const embed = new this.bot.methods.Embed()
      .setColor(0x0800ff)
      .setTitle(response.title_japanese)
      .setDescription(response.title_romaji === response.title_english
        ? response.title_english
        : `${response.title_romaji}\n${response.title_english}`)
      .setThumbnail(response.image_url_lge)
      .addField('Genres', response.genres.join(', '), true)
      .addField('Bewertung | Typ', `${response.average_score} | ${response.type}`, true);
    if (msg.cmd === 'anime') {
      embed.addField('Folgen', response.total_episodes, true);
    } else {
      embed.addField('Kapitel | Volumes',
        `${response.total_chapters} | ${response.total_volumes}`,
        true);
    }
    if (response.start_date_fuzzy) {
      let title = 'Start';
      let value = this.formatFuzzy(response.start_date_fuzzy);
      if (
        (response.airing_status
          && response.airing_status === 'finished airing')
        || (response.publishing_status
          && response.publishing_status === 'finished publishing')) {
        title = 'Zeitraum';
        value += ` - ${response.end_date_fuzzy ? this.formatFuzzy(response.end_date_fuzzy) : `Nicht angegeben`}`;
      }
      embed.addField(title, value, true);
    }
    if (response.description.length < 1025) {
      embed.addField('Beschreibung (Englisch)', response.description);
    } else {
      const description = response.description.match(/(.|[\r\n]){1,1024}/g);
      for (let i = 0; i < description.length; i++) {
        embed.addField(i === 0 ? 'Lange Beschreibung' : '\u200b',
          description[i]);
      }
    }
    if (msg.cmd === 'anime') {
      embed.addField('Airing Status:', this.replaceMap(response.airing_status, { 'finished airing': 'Abgeschlossen', 'currently airing': 'Läuft', 'not yet aried': 'Noch nicht gelaufen', cancelled: 'Abgebrochen', null: 'Nicht Angegeben' }), true)
        .addField('Herkunft', `${response.source}`.replace('null', 'Nicht Angegeben'), true);
    } else {
      embed.addField('Publishing Status:', this.replaceMap(response.publishing_status, { 'finished publishing': 'Abgeschlossen', publishing: 'Läuft', 'not yet published': 'Noch nicht begonnen', cancelled: 'Abgebrochen', null: 'Nicht Angegeben' }), true);
    }
    if (mes) mes.edit({ embed });
    else msg.channel.sendEmbed(embed);
  }


  replaceMap(input, map) {
    const regex = [];
    for (const key in map) {
      regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
    }
    return input.replace(new RegExp(regex.join('|'), 'g'), w => map[w]);
  }


  formatFuzzy(input) {
    input = input.toString();
    return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['manga'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'anime',
      description: 'Gibt Infos über den gesuchten Anime oder Manga.',
      shortdescription: 'bzw. `$conf.prefixmanga`',
      usage: '$conf.prefixanime [Suchbegriff(e)]'
      + '\n$conf.prefixmanga [Suchbegriff(e)]',
    };
  }
};
