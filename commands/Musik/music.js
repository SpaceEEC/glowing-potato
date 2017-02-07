exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  bot.commands.get('help').run(bot, msg, ['music']);
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
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
  + `\`$conf.prefixqueue (Seite)\` - Zeigt die Queue an.\n`
  + `\`$conf.prefixskip\` - Überspringt den aktuellen Song.\n`
  + `\`$conf.prefixpause\` - Pausiert den aktuellen Song.\n`
  + `\`$conf.prefixresume\` - Setzt den aktuell pausierten Song fort.\n`
  + `\`$conf.prefixstop\` - Beendet die Wiedergabe und löscht die Queue.\n`
  + `\`$conf.prefixvolume (0-200)\` - Setzt die Lautstärke von \`0\` bis \`200\`. (Standardwert beträgt 20.)\n`
  + `\`$conf.prefixshuffle\` - Mischt einmal kräftig durch die Warteschlange durch.\n`
  + `\`$conf.prefixloop (an|aus)\` - Aktiviert/Deaktiviert das Wiederholen, des letzten Songs in der Wiedergabeliste.\n`,
};
