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
  usage: `\`$conf.prefixplay [ID/Url] (Anzahl)\` - Spielt Songs.\nDer Befehl Akzeptiert Videos und Playlists als Youtube IDs und Links.\nBei Playlists werden, falls nicht anders angegeben, maximal 20 Elemente aus dieser Abgerufen..\n`
  + `\`$conf.prefixsearch (-N) [Suchgebriffe]\` - Ermöglicht die Suche nach Songs auf Youtube.\n`
  + `(Bei Angabe einer Anzahl werden die ersten (Anzahl) Ergebnisse vorgeschlagen und der angenommene wird eingereiht.)\n`
  + `Beispiel: \`$conf.prefixsearch -5 yousei teikoku\` würde die ersten 5 Ergebnisse auf diese Suchanfrage abfragen, bis eine angenommen wird, oder alle durch sind.\n`
  + `\`$conf.prefixnp\` - Zeigt den aktuell gespielten Song an.\n`
  + `\`$conf.prefixqueue (Seite)\` - Zeigt die aktuelle Warteschlange an. (Optional kann eine bestimmte Seite angegeben werden.).\n`
  + `\`$conf.prefixskip\` - Überspringt den aktuellen Song.\n`
  + `\`$conf.prefixpause\` - Pausiert den aktuellen Song.\n`
  + `\`$conf.prefixresume\` - Setzt den aktuell pausierten Song fort.\n`
  + `\`$conf.prefixstop\` - Beendet die Wiedergabe und löscht die Queue.\n`
  + `\`$conf.prefixvolume (0-200)\` - Setzt die Lautstärke von \`0\` bis \`200\`. (Standardwert beträgt 20.)\n`
  + `\`$conf.prefixshuffle\` - Mischt einmal kräftig durch die Warteschlange durch.\n`
  + `\`$conf.prefixloop (an|aus)\` - Aktiviert/Deaktiviert das Wiederholen, des aktuellen Songs.\n`,
};
