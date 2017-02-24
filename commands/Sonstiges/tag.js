module.exports = class Tag {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (params[0] && this.bot.internal.tags.has(`${msg.guild.id}|${params.join(' ')}`)) {
      return msg.channel.sendMessage(this.bot.internal.tags.get(`${msg.guild.id}|${params.join(' ')}`).response);
    } else if (!params[0] || params[0] === 'list') {
      const TagList = this.bot.commands.get('tag-list');
      return new TagList(this.bot).run(msg);
    } else if (params[0] === 'add') {
      const TagAdd = this.bot.commands.get('tag-add');
      return new TagAdd(this.bot).run(msg, params.slice(1));
    } else if (params[0] === 'edit') {
      const TagEdit = this.bot.commands.get('tag-edit');
      return new TagEdit(this.bot).run(msg, params.slice(1));
    } else if (params[0] === 'remove') {
      const TagDel = this.bot.commands.get('tag-del');
      return new TagDel(this.bot).run(msg, params.slice(1));
    } else {
      let response = ['http://puu.sh/t1PqI/026da4b79f.jpg',
        'https://memegen.link/kermit/i-don\'t-know-that-tag/but-that\'s-none-of-my-business.jpg',
        'https://memegen.link/afraid/i-don\'t-know-this-tag/and-at-this-point-i\'m-too-afraid-to-ask.jpg',
        'https://memegen.link/doge/such-404/very-not-found.jpg',
        'https://memegen.link/mordor/one-does-not-simply/use-a-none-existing-tag.jpg',
        'https://memegen.link/philosoraptor/what-if/this-tag-doesn\'t-exist.jpg',
        'https://memegen.link/winter/prepare-yourself/tags-are-coming.jpg'];
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setcolor(msg.member.color()).setDescription('Fehler: Tag nicht gefunden.')
        .setImage(response[Math.floor(Math.random() * response.length)]));
    }
  }

  static blacklist(msg, rsp) {
    // Nicht Hotlinkbare Bilderhoster
    const response = rsp.toLowerCase();
    if (response.includes('prntscr.com')) return false;
    else if (response.includes('gyazo.com')) return false;
    else if (response.includes('imgur.com')
      && !response.includes('i.imgur.com')
      && !response.includes('i.stack.imgur.com')) return false;
    return true;
  }

  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 0,
      createLevel: 1,
      editLevel: 5,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'tag',
      description: 'Zum Anzeigen / Auflisten / Hinzufügen / Editieren / Löschen von benutzerdefinierten Tags.\nNur Mods und höher können fremde Tags editieren oder löschen.', // eslint-disable-line
      shortdescription: 'Tags',
      usage: '$conf.prefixtag <add> [Name] [Response] - Weitere hilfe mit `$conf.prefixhelp tag-add`'
      + '\n$conf.prefixtag <edit> [Name] [Response] - Weitere hilfe mit `$conf.prefixhelp tag-edit`'
      + '\n$conf.prefixtag <remoe> [Name] - Weitere hilfe mit `$conf.prefixhelp tag-del`'
      + '\n$conf.prefixtag <list> - Zeigt alle Tags an. Alternativ: `$conf.prefix tags`',
    };
  }
};
