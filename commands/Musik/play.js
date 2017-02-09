const request = require('superagent');
const yt = require('ytdl-core');


exports.run = async (bot, msg, params = []) => {
  if (bot.internal.musik.has(msg.guild.id)) {
    bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg));
  }
  if (!params[0]) {
    msg.channel.sendMessage('Bitte gib mir einen Youtubelink oder ID mit, andernfalls kann ich leider nichts spielen.')
      .then((mes) => mes.delete(5000));
  } else if (bot.internal.music.channel(bot, msg, false)) {
    msg.channel.sendMessage('Bist du sicher, dass du dich im korrekten Voicechannel befindest?')
      .then((mes) => mes.delete(5000));
  } else if (params[0].includes('watch?v=') || params[0].length === 11) {
    exports.add(bot, await msg.channel.sendMessage('Rufe Video ab...'), params[0], msg);
  } else if (params[0].includes('playlist?list=') || params[0].length > 11) {
    bulkadd(bot, msg, params[0].includes('playlist?list=') ? params[0].split('playlist?list=')[1] : params[0], params[1]);
  }
};

exports.add = async (bot, msg, url, originalmsg) => {
  if (!bot.internal.musik.has(msg.guild.id)) {
    bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, originalmsg));
  }
  const musik = bot.internal.musik.get(msg.guild.id);
  yt.getInfo(url, (err, info) => {
    if (err) {
      if (url.indexOf('?v=') !== -1) url = url.substr(url.indexOf('?v=') + 3);
      bot.err(`${url} | ${err.message}`);
      return msg.edit('Es ist ein Fehler, beim Abrufen des Videos von Youtube aufgetreten!\nIst es öffentlich abrufbar?');
    }
    bot.info(`[${msg.guild.id}] Song added: ${info.title} Length: ${musik._formatSecs(info.length_seconds)}.`);
    musik.add({ url: url, info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member });
    return msg.edit('', {
      embed: {
        color: 0xFFFF00,
        author: {
          name: msg.member.displayName,
          icon_url: msg.author.displayAvatarURL,
          url: null
        },
        description: `**++** [${info.title}](${info.loaderUrl})\n`
        + `Dauer: ${musik._formatSecs(info.length_seconds)}\n`
        + `Hinzugefügt von: ${msg.member}`,
        type: 'image',
        image: { url: info.iurl },
        footer: { text: `wurde hinzugefügt.${musik._music.disp ? ` (Ungefähre Zeit bis dahin: ${musik._formatSecs(musik._music.queue.reduce((a, b) => a + parseInt(b.info.length_seconds), parseInt(`-${musik._formatSecs(Math.floor(musik._music.disp.time / 1000))}`)))})` : ''}`, icon_url: bot.user.avatarURL },
      }
    }).then((mes) => {
      mes.delete(30000);
    });
  });
};

async function bulkadd(bot, msg, id, count) {
  if (!parseInt(count)) {
    count = 20;
  } else if (parseInt(count) < 0) {
    count = count + count + count;
  }
  bot.debug(count);
  const statusmsg = await msg.channel.sendMessage('Rufe die Playlist ab...');
  const ids = await new Promise(resolve => query(bot, id, count, null, resolve));
  statusmsg.edit(`Verarbeite \`${ids.length}\` in der Playlist gefundene Songs, dies kann einen Moment dauern...`);
  let fin = ids.length;
  const toAdd = [];
  for (const vid in ids) {
    yt.getInfo(ids[vid], (err, info) => {
      if (err) {
        bot.err(err.message);
        fin--;
        if (toAdd.length === fin) {
          validate(bot, toAdd, true, null, statusmsg, bot.internal.musik.get(msg.guild.id));
        }
      } else {
        bot.debug(info.title);
        validate(bot, toAdd, fin, { order: vid, url: ids[vid], info: { title: info.title, loaderUrl: info.loaderUrl, length_seconds: info.length_seconds, iurl: info.iurl }, requester: msg.member }, statusmsg, bot.internal.musik.get(msg.guild.id));
      }
    });
  }
}

function validate(bot, toAdd, fin, pushobj, statusmsg, musik) {
  bot.debug('validate');
  if (pushobj) pushobj = toAdd.push(pushobj);
  if (fin === true || pushobj === fin) {
    const ordered = toAdd.sort((a, b) => a.order - b.order);
    if (ordered.length) {
      musik.add(ordered);
      statusmsg.edit(`Erfolgreich \`${ordered.length}\` Songs hinzugefügt.`)
        .then((del) => del.delete(10000));
    } else {
      statusmsg.edit(`\`${ordered.length}\` Songs hinzugefügt.\nSicher, dass die Playlist korrekt ist?\n(Gelöschte Videos / nicht in Deutschland erreichbar)`)
        .then((del) => del.delete(10000));
    }
  }
}

async function query(bot, id, finalamount, token, resolve, arr = []) {
  let requestamount = finalamount > 50 ? 50 : finalamount;
  finalamount -= requestamount;
  try {
    const res = await request.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${requestamount}&playlistId=${id}&${token ? `pageToken=${token}` : ''}&fields=items/snippet/resourceId/videoId,nextPageToken,pageInfo/totalResults&key=${bot.internal.auth.googletoken}`)
      .send(null)
      .set('Accept', 'application/json');
    arr = arr.concat(JSON.parse(res.text).items.map(s => s.snippet.resourceId.videoId));
    bot.debug(['query', requestamount, finalamount, JSON.parse(res.text).nextPageToken]);
    if (!JSON.parse(res.text).nextPageToken || finalamount === 0) resolve(arr);
    else query(bot, id, finalamount, JSON.parse(res.text).nextPageToken, resolve, arr);
  } catch (e) {
    if (e.status === 404) {
      resolve(`Diese Playlist wurde nicht gefunden:\n`
        + `https://www.youtube.com/playlist?list=${id}\n`
        + `Sicher, dass dieser Link korrekt ist?`);
    } else if (e) {
      resolve(`Es ist ein Fehler beim ab Abrufen der Playlist aufgetreten:\n`
        + `Responsecode: ${e.status}\n`
        + `Nachricht: ${e.message}`);
    }
  }
}


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'play',
  shortdescription: '',
  description: 'Spielt Songs.\nDer Befehl Akzeptiert Videos und Playlists als Youtube IDs und Links.',
  usage: '$conf.prefixplay [ID/Url]',
};
