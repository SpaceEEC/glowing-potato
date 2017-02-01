const request = require('superagent');

exports.run = async (bot, msg, params = []) => {
  if (!params[0]) {
    const mes = await msg.channel.sendEmbed({
      title: 'Ein kleines Missgeschick',
      description: `\u200b
Du hast vergessen mir deine Suchanfrage mitzugeben.
Soll ich jetzt den ganzen Weg zum Server, ohne mindestens einen Suchbegriff zu haben, gehen?
Ich denke nicht. 👀`,
      fields: [
        {
          name: `Ich bin gnädig und gebe dir noch eine Chance mir etwas mitzugeben.`,
          value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
        }],
      color: msg.member.highestRole.color,
    });
    const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] }
    ).catch(() => mes.delete());
    mes.delete();
    if (collected.first().content === 'cancel') {
      collected.first().delete();
      return msg.delete();
    } else {
      return authcheck(bot, msg, collected.first().content.split(' '));
    }
  }
  if (params.join(' ').includes('?')) {
    return msg.channel.sendEmbed(
      new bot.methods.Embed()
        .setColor(0xffff00)
        .setDescription('Bitte keine Fragezeichen verwenden, die Anfrage würde dadurch ungültig werden.')
    );
  }
  return authcheck(bot, msg, params);
};

async function authcheck(bot, msg, params) {
  if (bot.config.ani_expires <= Math.floor(Date.now() / 1000) + 300) {
    const message = await msg.channel.sendEmbed(
      new bot.methods.Embed()
        .setColor(0xffff00)
        .setDescription('Der Token ist ausgelaufen, fordere einen neuen an\nDies kann einen Moment dauern.'));
    const res = await request.post(`https://anilist.co/api/auth/access_token`)
      .send({
        grant_type: 'client_credentials',
        client_id: bot.internal.auth.anilist.client_id,
        client_secret: bot.internal.auth.anilist.client_secret,
      })
      .set('Content-Type', 'application/json');
    bot.config.ani_token = res.body.access_token;
    bot.config.ani_expires = res.body.expires;
    bot.debug(`"UPDATE \`config\` SET \`ani_token\`=${bot.config.ani_token} AND \`ani_expires\`=${bot.config.ani_expires} WHERE \`_rowid_\`='1';"`);
    await bot.db.run("UPDATE `config` SET `ani_expires`=? AND `ani_token`=? WHERE `_rowid_`='1';", bot.config.ani_expires, bot.config.ani_token);
    await message.edit('', {
      embed: new bot.methods.Embed()
        .setColor(0x00ff08)
        .setDescription('Token erneuert.'),
    });
    return query(params.join(' '), msg, bot);
  } else {
    return query(params.join(' '), msg, bot);
  }
}


async function query(search, msg, bot) {
  const res = await request.get(`https://anilist.co/api/${msg.cmd}/search/${search}?access_token=${bot.config.ani_token}`)
    .send(null)
    .set('Content-Type', 'application/json');
  let response;
  response = JSON.parse(res.text);
  if (response.error) {
    if (response.error.messages[0] === 'No Results.') {
      return msg.channel.sendEmbed(
        new bot.methods.Embed()
          .setColor(0xffff00)
          .setDescription(`Keinen ${msg.cmd} auf diese Anfrage gefunden.`)
          .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
    } else {
      return msg.channel.sendEmbed(
        new bot.methods.Embed()
          .setColor(0xffff00)
          .setTitle('Unerwarteter Fehler:')
          .setDescription(`Sowas sollte nicht passieren.
Bitte kontaktiere \`spaceeec#0302\`\n\n${response.error.messages[0]}`)
          .setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
    }
  } else if (!response[1]) {
    return answer(response[0], msg, bot);
  } else {
    return getanswer(bot, msg, response);
  }
}


const getanswer = async (bot, msg, response) => {
  let count = 1;
  const message = await msg.channel.sendEmbed(
    new bot.methods.Embed()
      .setColor(msg.member.color())
      .setTitle(`Es gibt mehrere ${msg.cmd} auf diese Suchanfrage:`)
      .setDescription(response.map(r => `${count++}\t\t${r.title_english}`).join('\n'))
      .addField(`Gib die Nummer des ${msg.cmd}s, für den weiter Informationen haben möchtest an.`,
      'Diese Anfrage wird bei `cancel` oder automatisch nach `30` Sekunden abgebrochen.'));
  const collected = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] })
    .catch(() => message.delete());
  const input = collected.first().content;
  if (input === 'cancel') {
    msg.delete();
    collected.first().delete();
    message.delete();
  } else if (input % 1 !== 0 || !response[parseInt(input) - 1]) {
    collected.first().delete();
    message.delete();
    getanswer(bot, msg, response);
  } else {
    collected.first().delete();
    answer(response[parseInt(input) - 1], msg, bot, message);
  }
};

function answer(response, msg, bot, mes) {
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'" };
  response.description = response.description.replace(/&([^;]+);/g, (m, c) => map[c])
    .split('`').join('\'').split('<br>').join('\n'); // eslint-disable-line
  const embed = new bot.methods.Embed()
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
    let value = formatFuzzy(response.start_date_fuzzy);
    if (
      (response.airing_status
        && response.airing_status === 'finished airing')
      || (response.publishing_status
        && response.publishing_status === 'finished publishing')) {
      title = 'Zeitraum';
      value += ` - ${response.end_date_fuzzy ? formatFuzzy(response.end_date_fuzzy) : `Nicht angegeben`}`;
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
    embed
      .addField('Airing Status:', replaceMap(response.airing_status, { 'finished airing': 'Abgeschlossen', 'currently airing': 'Läuft', 'not yet aried': 'Noch nicht gelaufen', cancelled: 'Abgebrochen', null: 'Nicht Angegeben' }), true)
      .addField('Herkunft', `${response.source}`.replace('null', 'Nicht Angegeben'), true);
  } else {
    embed
      .addField('Publishing Status:', replaceMap(response.publishing_status, { 'finished publishing': 'Abgeschlossen', 'publishing': 'Läuft', 'not yet published': 'Noch nicht begonnen', cancelled: 'Abgebrochen', null: 'Nicht Angegeben' }), true)
  }
  if (mes) mes.edit('', { embed });
  else msg.channel.sendEmbed(embed);
}


function replaceMap(input, map) {
  const regex = [];
  for (var key in map) {
    regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
  }
  return input.replace(new RegExp(regex.join('|'), 'g'), w => map[w]);
}


function formatFuzzy(input) {
  input = input.toString();
  return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
}


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['manga'],
  permLevel: 0,

};


exports.help = {
  name: 'anime',
  description: 'Gibt Infos über den gesuchten Anime oder Manga.',
  shortdescription: 'bzw. `$conf.prefixmanga`',
  usage: '$conf.prefixanime [Suchbegriff(e)]'
  + '\n$conf.prefixmanga [Suchbegriff(e)]',
};
