const request = require('superagent');

exports.run = async (bot, msg, params = []) => {
  if (bot.internal.music.perms(msg)) {
    if (!bot.internal.musik.has(msg.guild.id)) {
      bot.internal.musik.set(msg.guild.id, new bot.internal.music.Player(bot, msg));
    }
    if (!msg.member.voiceChannel) {
      msg.channel.sendMessage('Ich kann dich in keinem Voicechannel finden, bist du sicher, dass gerade dich in einem in dieser Gilde befindest?')
        .then((mes) => mes.delete(5000));
    } else if (!bot.internal.music.channel(bot, msg, true)) {
      msg.channel.sendMessage('Für diesen Befehl müssen wir uns leider beide im selben Channel befinden.')
        .then((mes) => mes.delete(5000));
    } else if (params[0]) {
      searchVideo(bot, msg, params);
    } else {
      msg.channel.sendMessage('Ich könnte eine Suche gebrauchen. Ein einziges Wort würde reichen!')
        .then((mes) => mes.delete(5000));
    }
  }
};

async function searchVideo(bot, msg, params) {
  let count = 1;
  if (params[0].match(/^-\d+$/g)) {
    count = params[0].replace('-', '');
    if (parseInt(count) > 50 || parseInt(count) < 0) {
      count = 50;
    }
    params = params.slice(1);
  }
  const statusmsg = await msg.channel.sendMessage('Wird gesucht, dies kann einen moment dauern...');
  try {
    const res = await request.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${count}&order=relevance&q=${params.join('+')}&fields=items(id/videoId,snippet(thumbnails(default/url,high/url,maxres/url,medium/url,standard/url),title))&type=video&key=${bot.internal.auth.googletoken}`)
      .send(null)
      .set('Accept', 'application/json');
    if (JSON.parse(res.text).items.length === 0) {
      statusmsg.edit(`Auf diese Suchanfrage wurde nichts gefunden.`);
    } else if (JSON.parse(res.text).items.length === 1) {
      bot.commands.get('play').add(bot, statusmsg, JSON.parse(res.text).items[0].id.videoId, msg);
      statusmsg.edit('Erfolgreich gefunden!').then(tmp => tmp.delete(5000));
    } else {
      statusmsg.delete();
      selectItem(bot, msg, JSON.parse(res.text).items, 0);
    }
  } catch (e) {
    statusmsg.edit(`Es ist ein Fehler bei der Suchanfrage aufgetreten:\n`
      + `Responsecode: ${e.status}\n`
      + `${e.text}`);
  }
}

async function selectItem(bot, msg, search, index, original) {
  // Löscht die Nachricht, falls das Ende erreicht ist. (NICHT LÖSCHEN)
  if (!search[index]) {
    if (original) {
      original.delete();
      msg.delete();
    }
    return;
  }
  let thumbnail = search[index].snippet.thumbnails;
  thumbnail = thumbnail.maxres ? thumbnail.maxres.url
    : thumbnail.standard ? thumbnail.standard.url
      : thumbnail.high ? thumbnail.high.url
        : thumbnail.medium ? thumbnail.medium.url
          : thumbnail.default ? thumbnail.default.url
            : undefined;
  const embed = new bot.methods.Embed()
    .setColor(0x9370DB)
    .setTitle(search[index].snippet.title)
    .setImage(thumbnail)
    .setDescription('`y` zum bestätigen\n`n` für das nächste Ergebnis\n\nDiese Anfrage wird entweder in `30` Sekunden, oder bei der Eingabe von `cancel` abgebrochen.')
    .setFooter(`Suchergebnis ${index + 1} von insgesamt ${search.length} Ergebnissen.`, bot.user.avatarURL);
  let func;
  if (original) func = original.edit('', { embed: embed });
  else func = msg.channel.sendEmbed(embed);
  const mes = await func;
  try {
    const collected = await mes.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000, errors: ['time'] });
    let input = collected.first().content;
    if (input !== 'y' && input !== 'n') {
      msg.delete();
      mes.delete();
      collected.first().delete();
    } else if (input === 'n') {
      collected.first().delete();
      selectItem(bot, msg, search, index + 1, mes);
    } else {
      collected.first().delete();
      mes.delete();
      bot.commands.get('play').add(msg, search[index].id.videoId);
    }
  } catch (e) {
    msg.delete();
    mes.delete();
  }
}
exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['serach'],
  permLevel: 0,
};


exports.help = {
  name: 'search',
  shortdescription: '',
  description: 'Ermöglicht die Suche über Youtube.',
  usage: '$conf.prefixsearch (-N) [Suche]\n'
  + 'Beispiele:\n'
  + '`$conf.prefixsearch (-3) Cash Cash` - Lässt zwischen den ersten drei Ergebnissen auswählen.\n'
  + '`$conf.prefixsearch Cash Cash` - Nimmt einfach das erste Ergebnis und fügt es hinzu.\n',
};
