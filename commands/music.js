// This whole file is just shitcode

exports.run = async (bot, msg, params = []) => {
  if (msg.cmd === 'music') {
    bot.commands.get('help').run(bot, msg, ['music']);
  } else if (msg.cmd === 'np') {
    msg.channel.send(bot.musik.np())
      .then(mes => mes.delete(30000));
  } else if (msg.cmd === 'queue') {
    msg.channel.send(bot.musik.queue())
      .then((mes) => mes.delete(30000))
      .catch((e) => require('util').inspect(e));
  } else if (msg.permlvl >= 11
    || ((!msg.conf.musicgroup || (msg.conf.musicgroup && msg.member.roles.has(msg.conf.musicgroup)))
      && (!msg.conf.musicchannel || (msg.conf.musicchannel && msg.channel.id === msg.conf.musicchannel)))) {
    if (msg.cmd === 'play') {
      if (!msg.member.voiceChannel) {
        msg.channel.sendMessage('Du bist in keinem Voicechannel.')
          .then((mes) => mes.delete(5000));
      } else if (msg.guild.member(bot.user).voiceChannel
        && (msg.guild.member(bot.user).voiceChannel.id
          !== msg.member.voiceChannel.id)) {
        msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten VoiceChannel bist?')
          .then((mes) => mes.delete(5000));
      } else if (params[0].includes('watch?v=') || params[0].length === 11) {
        bot.musik.add(msg, params[0]);
      } else if (params[0].includes('playlist?list=')) {
        bot.musik.bulkadd(msg, params[0].split('playlist?list=')[1])
          .then((mes) => mes.delete(5000));
      } else if (params[0].length > 11) {
        bot.musik.bulkadd(msg, params[0])
          .then((mes) => mes.delete(5000));
      }
    } else if (msg.cmd === 'search') {
      if (!msg.member.voiceChannel) {
        msg.channel.sendMessage('Du bist in keinem Voicechannel.')
          .then((mes) => mes.delete(5000));
      } else if (msg.guild.member(bot.user).voiceChannel
        && (msg.guild.member(bot.user).voiceChannel.id
          !== msg.member.voiceChannel.id)) {
        msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten VoiceChannel bist?')
          .then((mes) => mes.delete(5000));
      } else if (params[0]) {
        bot.musik.search(msg, params);
      } else {
        msg.channel.sendMessage('Sag mir doch bitte was du hören möchtest, ja?')
          .then((mes) => mes.delete(5000));
      }
    } else if (msg.cmd === 'skip') {
      if (!msg.guild.member(bot.user).voiceChannel) {
        msg.channel.sendMessage('Was willst du denn bitte skippen?')
          .then((mes) => mes.delete(5000));
      } else if (!(msg.member.voiceChannel
        && msg.member.voiceChannel.id
        === msg.guild.member(bot.user).voiceChannel.id)) {
        msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten VoiceChannel bist?')
          .then((mes) => mes.delete(5000));
      } else {
        msg.channel.sendMessage(bot.musik.skip())
          .then((mes) => mes.delete(30000));
      }
    } else if (msg.cmd === 'pause') {
      let response = 'A rendom error has appeared!';
      response = bot.musik.pauseresume(false);
      msg.channel.send(response)
        .then((mes) => mes.delete(5000));
    } else if (msg.cmd === 'resume') {
      let response = 'A rendom error has appeared!';
      response = bot.musik.pauseresume(true);
      msg.channel.send(response)
        .then((mes) => mes.delete(5000));
    } else if (msg.cmd === 'stop') {
      msg.channel.send(bot.musik.stop())
        .then((mes) => mes.delete(5000));
    } else if (msg.cmd === 'volume') {
      if (!msg.guild.member(bot.user).voiceChannel) {
        msg.channel.sendMessage('Sehe ich so aus, als würde ich gerade etwas spielen?')
          .then((mes) => mes.delete(5000));
      } else if (!(msg.member.voiceChannel
        && msg.member.voiceChannel.id
        === msg.guild.member(bot.user).voiceChannel.id)) {
        msg.channel.sendMessage('Eine interstellare Interferenz behindert die Nachrichtenübertragung, bist du sicher, dass du im korrekten VoiceChannel bist?')
          .then((mes) => mes.delete(5000));
      } else if (params[0] % 1 === 0) {
        if (parseInt(params[0]) > 200 || parseInt(params[0]) < 0) {
          msg.channel.sendMessage('Bitte nur Zahlen von `0` bis `200` eingeben.');
        } else {
          msg.channel.send(bot.musik.volume(Math.round(params[0] / 10) / 10));
        }
      } else {
        msg.channel.send(bot.musik.volume('get'));
      }
    }
  } else {
    // nicht im channel / nicht im besitzt der gruppe, etc.
  }
};


exports.conf = {
  group: 'Music',
  spamProtection: false,
  enabled: true,
  aliases: ['play', 'search', 'np', 'queue', 'skip', 'pause', 'resume', 'stop', 'volume'],
  permLevel: 0,
};


exports.help = {
  name: 'music',
  description: 'Ermöglicht die Interaktion mit dem Musicfeature des Bots.',
  shortdescription: '`$conf.prefixhelp music`',
  usage: `\`$conf.prefixplay [ID oder URL]\` - Unterstützt sowohl einzelne Videos, als auch Playlists.\n`
  + `\`$conf.prefixsearch (-Anzahl) [Titel]\` - Sucht nach dem angegebenem Titel auf Youtube.\n`
  + `(Bei Angabe einer Anzahl werden die ersten (Anzahl) Ergebnisse vorgeschlagen und der angenommene wird eingereiht.)\n`
  + `Beispiel: \`$conf.prefixsearch -5 yousei teikoku\` würde die ersten 5 Ergebnisse auf diese Suchanfrage abfragen, bis eine angenommen wird, oder alle durch sind.\n`
  + `\`$conf.prefixnp\` - Zeigt den aktuell gespielten Song an.\n`
  + `\`$conf.prefixqueue\` - Zeigt die Queue an.\n`
  + `\`$conf.prefixskip\` - Überspringt den aktuellen Song.\n`
  + `\`$conf.prefixpause\` - Pausiert den aktuellen Song.\n`
  + `\`$conf.prefixresume\` - Setzt den aktuell pausierten Song fort.\n`
  + `\`$conf.prefixstop\` - Beendet die Wiedergabe und löscht die Queue.\n`
  + `\`$conf.prefixvolume\` - Setzt die Lautstärke von \`0\` bis \`200\`. (Standardwert beträgt 20.)\n`,
};
