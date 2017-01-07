exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  // Validating
  if (params[0] && bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
    return msg.channel.sendMessage(bot.internal.tags.get(`${msg.guild.id}|${params[0]}`).response);
  }
  if (!params[0]) {
    params[0] = 'list';
  } else if (params[0] !== 'list' && params[0] !== 'add' && params[0] !== 'remove' && params[0] !== 'edit') {
    let response = ['http://puu.sh/t1PqI/026da4b79f.jpg',
      'https://memegen.link/kermit/i-don\'t-know-that-tag/but-that\'s-none-of-my-business.jpg',
      'https://memegen.link/afraid/i-don\'t-know-this-tag/and-at-this-point-i\'m-too-afraid-to-ask.jpg',
      'https://memegen.link/doge/such-404/very-not-found.jpg',
      'https://memegen.link/mordor/one-does-not-simply/use-a-none-existing-tag.jpg',
      'https://memegen.link/philosoraptor/what-if/this-tag-doesn\'t-exist.jpg',
      'https://memegen.link/winter/prepare-yourself/tags-are-coming.jpg'];
    return msg.channel.sendEmbed({
      color: msg.guild.member(msg.author).highestRole.color,
      description: 'Fehler: Tag nicht gefunden.',
      type: 'image',
      image: {
        url: response[~~(Math.random() * (response.length - 0)) + 0],
      },
    });
  } else if (!params[1]) {
    // add or remove
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Fehlender Parameter',
      'Bitte einen [Tag] angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  } else if (params[0] !== 'remove' && !params[2]) {
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Fehlender Parameter',
      'Bitte eine [Response] angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL));
  }

  if (params[0] === 'add') {
    if (exports.conf.createLevel > msg.permlvl) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Zugriff verweigert',
        `Deine Rechte reichen leider nicht aus, um Tags zu erstellen.`, true)
        .addField('Rechte',
        `❯ Benötigt: ${exports.conf.createLevel}\n❯ Gegeben: ${msg.permlvl}`, true)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    if (params[1] === 'add' ||
      params[1] === 'edit' ||
      params[1] === 'remove' ||
      params[1] === 'list') {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Ungültiger Tagname',
        'Dieser Tagname ist Ungültig.')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    if (bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Bereits existent',
        `${params[1]} existiert bereits\nZum ändern bitte \`${msg.conf.prefix}tag edit [Tag] [Response]\` verwenden.!`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    if (!blacklist(msg, params.slice(2).join(' '))) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht hotlinkbar',
        'Dieses Bild ist nicht hotlinkbar, bitte gib einen hotlinkbaren Link an!`')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    bot.db.run('INSERT INTO "tags" (guild, name, response, author) VALUES (?, ?, ?, ?)',
      [msg.guild.id, params[1].toLowerCase(), params.slice(2).join(' '), msg.author.id]);
    bot.internal.tags
      .set(`${msg.guild.id}|${params[1].toLowerCase()}`,
      {
        guild: msg.guild.id,
        name: params[1].toLowerCase(),
        response: params.slice(2).join(' '),
        author: msg.author.id,
      });
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0x00ff00)
      .addField('Erfolgreich erstellt',
      `Tag: ${params[1]}\nResponse: ${params.slice(2).join(' ')}`)
      .setThumbnail(bot.user.avatarURL)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      msg.author.avatarURL)
    );
  } else if (params[0] === 'edit') {
    if (bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht existent',
        `Zum Erstellen bitte \`${msg.conf.prefix}tag edit [Tag] [Response]\`verwenden.`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    if (!(
      bot.internal.tags.get(`${msg.guild.id}|${params[1]}`).author === msg.author.id &&
      msg.permlvl >= exports.conf.editLevel)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Zugriff verweigert',
        `Nur Mods und höher können fremde Tags bearbeiten.`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL));
    }
    if (!blacklist(msg, params.slice(2).join(' '))) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht hotlinkbar',
        'Dieses Bild scheint nicht hotlinkbar, bitte gib einen hotlinkbaren Link an!`')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL)
      );
    }
    bot.db.run('UPDATE tags SET response=? WHERE guild=? AND name=?',
      [params.slice(2).join(' '), msg.guild.id, params[1].toLowerCase()]);
    bot.internal.tags.get(`${msg.guild.id}|${params[1].toLowerCase()}`).response = params.slice(2).join(' ');
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0x00ff00)
      .addField('Erfolgreich geändert',
      `Tag: ${params[1]}\nResponse: ${params.slice(2).join(' ')}`)
      .setThumbnail(bot.user.avatarURL)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  } else if (params[0] === 'remove') {
    if (bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht existent',
        `Vielleicht vertippt?`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL)
      );
    }
    // löschen
  } else if (params[0] === 'list') {
    let alle = '';
    let users = '';
    bot.internal.tags
      .filterArray((x, t) => t.startsWith(msg.guild.id))
      .sort()
      .map((tag) => { // eslint-disable-line
        if (tag.author === msg.author.id) users += `\`${tag.name}\` `;
        else alle += `\`${tag.name}\` `;
      });
    if (alle === '') alle = 'Entweder gehören alle Tags zu dir, oder es gibt gar keine auf diesem Server.';
    if (users === '') users = 'Du hast keine Tags, erstell doch welche!';
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0x3498db)
      .setTimestamp()
      .setThumbnail(bot.user.avatarURL)
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
      .addField('Verfügbare Tags:', alle)
      .addField(`Tags von ${msg.author.username}:`, users)
    );
  }
});


function blacklist(msg, rsp) {
  // Nicht Hotlinkbare Bilderhoster
  const response = rsp.toLowerCase();
  if (response.includes('prntscr.com')) return false;
  else if (response.includes('gyazo.com')) return false;
  else if (response.includes('imgur.com') &&
    !response.includes('i.imgur.com') &&
    !response.includes('i.stack.imgur.com')) return false;
  return true;
}


exports.init = (bot) => new Promise(() => { // eslint-disable-line
  bot.db.all(`SELECT * FROM tags`).then(rows => {
    for (let i = 0; i < rows.length; i++) {
      bot.internal.tags.set(`${rows[i].guild}|${rows[i].name}`, rows[i]);
    }
  });
});


exports.conf = {
  group: 'Allgemeines',
  spamProtection: false,
  enabled: true,
  aliases: ['tags'],
  permLevel: 0,
  createLevel: 1,
  editLevel: 5,
};
exports.help = {
  name: 'tag',
  description: 'Zum Anzeigen / Auflisten / Hinzufügen / Editieren / Löschen von benutzerdefinierten Tags.\nNur Mods und höher können fremde Tags editieren oder löschen.', // eslint-disable-line
  shortdescription: 'Tags',
  usage: `$conf.prefixtag <list|add|edit|remove> (Tag) (Response)`,
};
