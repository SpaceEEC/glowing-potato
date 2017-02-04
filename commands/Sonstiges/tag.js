exports.run = async (bot, msg, params = []) => { // eslint-disable-line consistent-return
  if (params[0] && bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`)) {
    return msg.channel.sendMessage(bot.internal.tags.get(`${msg.guild.id}|${params.join(' ')}`).response);
  }
  if (!params[0] || params[0] === 'list') {
    bot.commands.get('tag-list').run(bot, msg, params);
  } else if (params[0] === 'add') {
    bot.commands.get('tag-add').run(bot, msg, params.splice(1, 1));
  } else if (params[0] === 'edit') {
    bot.commands.get('tag-edit').run(bot, msg, params.splice(1, 1));
  } else if (params[0] === 'remove') {
    bot.commands.get('tag-del').run(bot, msg, params.splice(1, 1));
  } if (params[0] !== 'add' && params[0] !== 'remove' && params[0] !== 'edit') {
    wrongTag(msg);
  }
};


exports.blacklist = function blacklist(msg, rsp) {
  // Nicht Hotlinkbare Bilderhoster
  const response = rsp.toLowerCase();
  if (response.includes('prntscr.com')) return false;
  else if (response.includes('gyazo.com')) return false;
  else if (response.includes('imgur.com')
    && !response.includes('i.imgur.com')
    && !response.includes('i.stack.imgur.com')) return false;
  return true;
};


function wrongTag(msg) {
  let response = ['http://puu.sh/t1PqI/026da4b79f.jpg',
    'https://memegen.link/kermit/i-don\'t-know-that-tag/but-that\'s-none-of-my-business.jpg',
    'https://memegen.link/afraid/i-don\'t-know-this-tag/and-at-this-point-i\'m-too-afraid-to-ask.jpg',
    'https://memegen.link/doge/such-404/very-not-found.jpg',
    'https://memegen.link/mordor/one-does-not-simply/use-a-none-existing-tag.jpg',
    'https://memegen.link/philosoraptor/what-if/this-tag-doesn\'t-exist.jpg',
    'https://memegen.link/winter/prepare-yourself/tags-are-coming.jpg'];
  msg.channel.sendEmbed({
    color: msg.guild.member(msg.author).highestRole.color,
    description: 'Fehler: Tag nicht gefunden.',
    type: 'image',
    image: { url: response[Math.floor(Math.random() * response.length)] },
  });
}


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
  createLevel: 1,
  editLevel: 5,
};


exports.help = {
  name: 'tag',
  description: 'Zum Anzeigen / Auflisten / Hinzufügen / Editieren / Löschen von benutzerdefinierten Tags.\nNur Mods und höher können fremde Tags editieren oder löschen.', // eslint-disable-line
  shortdescription: 'Tags',
  usage: '$conf.prefixtag <add> [Name] [Response] - Weitere hilfe mit `$conf.prefixhelp tag-add`'
  + '\n$conf.prefixtag <edit> [Name] [Response] - Weitere hilfe mit `$conf.prefixhelp tag-edit`'
  + '\n$conf.prefixtag <remoe> [Name] - Weitere hilfe mit `$conf.prefixhelp tag-del`'
  + '\n$conf.prefixtag <list> - Zeigt alle Tags an. Alternativ: `$conf.prefix tags`',
};
