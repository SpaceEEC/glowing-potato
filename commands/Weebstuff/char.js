const fs = require('fs-extra-promise');
const request = require('superagent');
exports.run = async (bot, msg, params = []) => {
  if (!params[0]) {
    const mes = await msg.channel.sendEmbed({
      title: 'Ein kleines Missgeschick',
      description: `\u200b
Du hast vergessen mir deine Suchanfrage mitzugeben.
Soll ich jetzt den ganzen Weg zum Server, ohne einen Namen zu haben, gehen?
Ich denke nicht. 👀`,
      fields: [
        {
          name: `Ich bin gnädig und gebe dir noch eine Chance mir etwas mitzugeben.`,
          value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
        }],
      color: msg.member.highestRole.color,
    });
    try {
      const collected = await msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
        return input.author.id === this.options.mes.author.id; //eslint-disable-line
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] }
      );
      const input = collected.first().content;
      mes.delete();
      if (input === 'cancel') {
        collected.first().delete();
        return msg.delete();
      } else {
        return authcheck(bot, msg, input.split(' '));
      }
    } catch (err) {
      if (!err.size) {
        msg.delete();
        return mes.delete();
      } else {
        return bot.err(err.stack ? err.stack : err);
      }
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
    bot.db.run("UPDATE `config` SET `ani_expires`=? WHERE `_rowid_`='1';", bot.config.ani_expires);
    bot.db.run("UPDATE `config` SET `ani_token`=? WHERE `_rowid_`='1'", bot.config.ani_token);
    fs.writeFile('./var/auth.json', JSON.stringify(bot.internal.auth, null, 2), 'utf-8');
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
  const res = await request.get(`https://anilist.co/api/character/search/${search}?access_token=${bot.config.ani_token}`)
    .send(null)
    .set('Content-Type', 'application/json');
  let response;
  response = JSON.parse(res.text);
  if (response.error) {
    if (response.error.messages[0] === 'No Results.') {
      return msg.channel.sendEmbed(
        new bot.methods.Embed()
          .setColor(0xffff00)
          .setDescription(`Keinen Charakter auf diese Anfrage gefunden.`)
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


async function getanswer(bot, msg, response) {
  let count = 1;
  const message = await msg.channel.sendEmbed(
    new bot.methods.Embed()
      .setColor(msg.guild.member(msg.author).highestRole.color)
      .setTitle(`Es gibt mehrere Charaktere auf diese Suchanfrage:`)
      .setDescription(response.map(r => `${count++}\t\t${r.name_first} ${r.name_last}`).join('\n'))
      .addField(`Gib die Nummer des Charaktere, für den weiter Informationen haben möchtest an.`,
      'Diese Anfrage wird bei `cancel` oder automatisch nach `30` Sekunden abgebrochen.'));
  try {
    const collected = await msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
      if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
        return true;
      } else {
        return false;
      }
    }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] });
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
  } catch (error) {
    if (!error.size) {
      msg.delete();
      message.delete();
    } else {
      bot.err(error.stack ? error.stack : error);
    }
  }
}

function answer(response, msg, bot, mes) {
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'" };
  response.info = response.info.replace(/&([^;]+);/g, (m, c) => map[c])
    .split('`').join('\'').split('<br>').join('\n'); // eslint-disable-line 
  const embed = new bot.methods.Embed()
    .setColor(0x0800ff)
    .setTitle(`${response.name_first} ${response.name_last}`)
    .setDescription(`${response.name_japanese}\n\n${response.name_alt ? `Aliases:\n${response.name_alt}` : ''}`)
    .setThumbnail(response.image_url_med);
  if (response.info.length < 1025) {
    embed.addField('Beschreibung', response.info);
  } else {
    const info = response.info.match(/(.|[\r\n]){1,1024}/g);
    for (let i = 0; i < info.length; i++) {
      embed.addField(i === 0 ? 'Lange Beschreibung' : '\u200b',
        info[i]);
    }
  }
  if (mes) mes.edit('', { embed });
  else msg.channel.sendEmbed(embed);
}


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['character', 'charakter'],
  permLevel: 0,

};


exports.help = {
  name: 'char',
  description: 'Ruft einen Charakter aus der AnilistDB(Animes/Mangas) ab.',
  shortdescription: 'Charaktersuche',
  usage: '$conf.prefixchar [Suchbegriff(e)]',
};
