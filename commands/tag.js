exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  // This whole file is a mess. >.<
  // Validating
  if (params[0] && bot.internal.tags.has(`${msg.guild.id}|${params[0]}`)) {
    return msg.channel.sendMessage(bot.internal.tags.get(`${msg.guild.id}|${params[0]}`).response);
  }
  if (!params[0] || params[0] === 'list') {
    params[0] = 'list';
  } else if (params[0] !== 'add' && params[0] !== 'remove' && params[0] !== 'edit') {
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
      image: { url: response[Math.floor(Math.random() * (response.length - 0)) + 0] },
    });
  } else if (!params[1]) {
    // add, edit or remove
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Fehlender Parameter',
      'Bitte einen [Tag] angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL)
    );
  } else if (params[0] !== 'remove' && !params[2]) {
    // everything except removes, have to have a response
    return msg.channel.sendEmbed(new bot.methods.Embed()
      .setColor(0xff0000)
      .addField('Fehlender Parameter',
      'Bitte eine [Response] angeben.')
      .setFooter(`${msg.author.username}: ${msg.content}`,
      bot.user.avatarURL));
  }

  if (params[0] === 'add') {
    // checking permissions
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
    if (['add', 'edit', 'remove', 'list'].includes(params[1])) {
      // reserved words used for a tag?
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Ungültiger Tagname',
        'Dieser Tagname ist Ungültig.')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    if (bot.internal.tags.has(`${msg.guild.id}|${params[1]}`)) {
      // tag already created?
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
      // bad hoster for files?
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht hotlinkbar',
        'Dieses Bild ist nicht hotlinkbar, bitte gib einen hotlinkbaren Link an!`')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    // creating tag
    return bot.internal.tag.add(bot, msg.guild.id, params[1], params.slice(2).join(' '), msg.author.id)
      // success
      .then(() => {
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0x00ff00)
          .addField('Erfolgreich erstellt',
          `Tag: ${params[1]}\nResponse: ${params.slice(2).join(' ')}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          msg.author.avatarURL)
        );
      })
      // error
      .catch((e) => {
        bot.err(e);
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0xff0000)
          .addField('Interner Fehler beim Erstellen!',
          `Mehr Informationen:\n${e.stack ? e.stack : e}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          msg.author.avatarURL)
        );
      });
  } else if (params[0] === 'edit') {
    // does this tag exists?
    if (!bot.internal.tags.has(`${msg.guild.id}|${params[1]}`)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht existent',
        `Zum Erstellen bitte \`${msg.conf.prefix}tag edit [Tag] [Response]\`verwenden.`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    // permission to edit this tag?
    if (!(
      bot.internal.tags.get(`${msg.guild.id}|${params[1]}`).author === msg.author.id
      && msg.permlvl >= exports.conf.editLevel)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Zugriff verweigert',
        `Nur Mods und höher können fremde Tags bearbeiten.`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL));
    }
    // bad hoster?
    if (!blacklist(msg, params.slice(2).join(' '))) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht hotlinkbar',
        'Dieses Bild scheint nicht hotlinkbar, bitte gib einen hotlinkbaren Link an!')
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        bot.user.avatarURL)
      );
    }
    return bot.internal.tag.edit(bot, msg.guild.id, params[1].toLowerCase(), params.slice(2).join(' '))
      // success
      .then(() => {
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0x00ff00)
          .addField('Erfolgreich geändert',
          `Tag: ${params[1]}\nResponse: ${params.slice(2).join(' ')}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          bot.user.avatarURL)
        );
      })
      // error
      .catch((e) => {
        bot.err(e);
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0xff0000)
          .addField('Interner Fehler beim Ändern!',
          `Mehr Informationen:\n${e.stack ? e.stack : e}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          msg.author.avatarURL)
        );
      });
  } else if (params[0] === 'remove') {
    // checking if the tag exists
    if (!bot.internal.tags.has(`${msg.guild.id}|${params[1]}`)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Nicht existent',
        `Vielleicht vertippt?`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    // permission to delete this tag?
    if (!(
      bot.internal.tags.get(`${msg.guild.id}|${params[1]}`).author === msg.author.id
      && msg.permlvl >= exports.conf.editLevel)) {
      return msg.channel.sendEmbed(new bot.methods.Embed()
        .setColor(0xff0000)
        .addField('Zugriff verweigert',
        `Nur Mods und höher können fremde Tags löschen.`)
        .setThumbnail(bot.user.avatarURL)
        .setFooter(`${msg.author.username}: ${msg.content}`,
        msg.author.avatarURL)
      );
    }
    // löschen
    return bot.internal.tag.remove(bot, msg.guild.id, params[1])
      // success
      .then(() => {
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0x00ff00)
          .addField('Erfolgreich gelöscht',
          `Tag: ${params[1]}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          msg.author.avatarURL)
        );
      })
      // error
      .catch((e) => {
        bot.err(e);
        msg.channel.sendEmbed(new bot.methods.Embed()
          .setColor(0xff0000)
          .addField('Interner Fehler beim Ändern!',
          `Mehr Informationen:\n${e.stack ? e.stack : e}`)
          .setThumbnail(bot.user.avatarURL)
          .setFooter(`${msg.author.username}: ${msg.content}`,
          msg.author.avatarURL)
        );
      });
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
  else if (response.includes('imgur.com')
    && !response.includes('i.imgur.com')
    && !response.includes('i.stack.imgur.com')) return false;
  return true;
}


exports.conf = {
  group: 'Sonstiges',
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
