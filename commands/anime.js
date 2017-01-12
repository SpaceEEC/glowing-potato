const fs = require('fs-extra-promise');
const request = require('superagent');
exports.run = (bot, msg, params = []) => new Promise(() => {
  if (!params[0]) {
    return msg.channel.sendEmbed({
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
    }).then((mes) => {
      msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
        if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] }
      ).then(collected => {
        const input = collected.first().content;
        mes.delete();
        if (input === 'cancel') {
          collected.first().delete();
          msg.delete();
        } else {
          authcheck(bot, msg, input.split(' '));
        }
      }).catch(err => {
        if (!err.size) {
          msg.delete();
          mes.delete();
        } else {
          bot.err(err.stack ? err.stack : err);
        }
      });
    });
  }
  if (params.join(' ').includes('?')) {
    return msg.channel.sendEmbed(
      new bot.methods.Embed()
        .setColor(0xffff00)
        .setDescription('Bitte keine Fragezeichen verwenden, die Anfrage würde dadurch ungültig werden.')
    );
  }
  return authcheck(bot, msg, params);
});


function authcheck(bot, msg, params) {
  if (bot.config.ani_expires <= Math.floor(Date.now() / 1000) + 300) {
    return msg.channel.sendEmbed(
      new bot.methods.Embed()
        .setColor(0xffff00)
        .setDescription('Der Token ist ausgelaufen, fordere einen neuen an\nDies kann einen Moment dauern.'))
      .then(message => {
        request.post(`https://anilist.co/api/auth/access_token`)
          .send({
            grant_type: 'client_credentials',
            client_id: bot.internal.auth.anilist.client_id,
            client_secret: bot.internal.auth.anilist.client_secret,
          })
          .set('Content-Type', 'application/json')
          .end((err, res) => {
            if (err) {
              message.edit('', {
                embed: new bot.methods.Embed()
                  .setColor(0xff0000)
                  .setDescription('Es ist ein Fehler beim erneuern des Token aufgetreten.'),
              });
              bot.err(require('util').inspect(err));
            }
            bot.config.ani_token = res.body.access_token;
            bot.config.ani_expires = res.body.expires;
            bot.db.run("UPDATE `config` SET `ani_expires`=? WHERE `_rowid_`='1';", bot.config.ani_expires);
            bot.db.run("UPDATE `config` SET `ani_token`=? WHERE `_rowid_`='1'", bot.config.ani_token);
            fs.writeFile('./var/auth.json', JSON.stringify(bot.internal.auth, null, 2), 'utf-8');
            message.edit('', {
              embed: new bot.methods.Embed()
                .setColor(0x00ff08)
                .setDescription('Token erneuert.'),
            })
              .then(() => {
                query(params.join(' '), msg, bot);
              });
          });
      });
  } else {
    return query(params.join(' '), msg, bot);
  }
}


function query(search, msg, bot) {
  request.get(`https://anilist.co/api/${msg.cmd}/search/${search}?access_token=${bot.config.ani_token}`)
    .send(null)
    .set('Content-Type', 'application/json')
    .end((err, res) => {
      if (err) return msg.channel.sendMessage(`Es ist ein Fehler aufgetreten:\n\`${err.message}\``);
      let response;
      response = JSON.parse(res.text);
      /* try {
        response = JSON.parse(res.text);
      } catch (e) {
        bot.err('Fehler beim Parsen der Antwort von anilist');
        if (err) {
          bot.err(Object.getOwnPropertyNames(err));
          bot.err(err.status);
          bot.err(require('util').inspect(err.response));
        }
        if (res) bot.err(Object.getOwnPropertyNames(res));
        bot.err(e);
        return msg.chanel.sendMessage('Es ist ein Fehler beim Parsen der Antwort von Anilist aufgetreten.');
      }*/
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
    });
}


const getanswer = (bot, msg, response) => new Promise(() => {
  let count = 1;
  msg.channel.sendEmbed(
    new bot.methods.Embed()
      .setColor(msg.guild.member(msg.author).highestRole.color)
      .setTitle(`Es gibt mehrere ${msg.cmd} auf diese Suchanfrage:`)
      .setDescription(response.map(r => `${count++}\t\t${r.title_english}`).join('\n'))
      .addField(`Gib die Nummer des ${msg.cmd}s, für den weiter Informationen haben möchtest an.`,
      'Diese Anfrage wird bei `cancel` oder automatisch nach `30` Sekunden abgebrochen.')
  ).then(message => {
    msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
      if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
        return true;
      } else {
        return false;
      }
    }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] }
    ).then(collected => {
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
    }).catch(error => {
      if (!error.size) {
        msg.delete();
        message.delete();
      } else {
        bot.err(error.stack ? error.stack : error);
      }
    });
  });
});


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
      .addField('Airing Status:',
      `${response.airing_status}`
        .replace('finished airing', 'Abgeschlossen')
        .replace('currently airing', 'Läuft')
        .replace('not yet aried', 'Noch nicht gelaufen')
        .replace('cancelled', 'Abgebrochen')
        .replace('null', 'Nicht Angegeben'),
      true)
      .addField('Herkunft',
      `${response.source}`.replace('null', 'Nicht Angegeben'),
      true);
  } else {
    embed
      .addField('Publishing Status:',
      `${response.publishing_status}`
        .replace('finished publishing', 'Abgeschlossen')
        .replace('publishing', 'Läuft')
        .replace('not yet published', 'Noch nicht begonnen')
        .replace('cancelled', 'Abgebrochen')
        .replace('null', 'Nicht Angegeben'),
      true);
  }
  if (mes) mes.edit('', { embed });
  else msg.channel.sendEmbed(embed);
}


function formatFuzzy(input) {
  input = input.toString();
  return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
}


exports.conf = {
  group: 'Weebstuff',
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
