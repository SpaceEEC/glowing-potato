const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const request = require('superagent');

module.exports = class UrbanCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'urban',
      group: 'miscellaneous',
      memberName: 'urban',
      description: 'Displays a definition from urbandictionary.com .',
      guildOnly: true,
      args: [
        {
          key: 'search',
          prompt: stripIndents`what would you like to look up?
          You can specify \`-2\` at the beginning to look up a specific definition.\n`,
          type: 'string',
        }
      ]
    });
  }

  async run(msg, args) {
    if (args.search.split(' ')[0].match(/^-\d+$/g)) {
      args.nummer = parseInt(args.search.split(' ')[0].replace('-', ''));
      args.search = args.search.split(' ').slice(1).join(' ');
    } else { args.nummer = 1; }
    const res = await request.get(`http://api.urbandictionary.com/v0/define?term=${args.search}`)
      .send(null).set('Content-Type', 'application/json');
    args.nummer -= 1;
    if (res.body.list.length === 0) {
      return msg.embed(
        new Embed()
          .setColor(0x1d2439)
          .setAuthor('Urbandictionary',
          'http://www.urbandictionary.com/favicon.ico',
          'http://www.urbandictionary.com/')
          .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
          .addField('No resulst', 'Maybe made a typo?')
          .addField('Search:', `[URL](http://www.urbandictionary.com/define.php?term=${args.search})`)
          .setFooter(msg.content, msg.author.avatarURL)
      );
    } else {
      if (!res.body.list[args.nummer]) {
        args.nummer = res.body.list.length - 1;
      }
      const e = new Embed()
        .setColor(0x1d2439)
        .setAuthor('Urbandictionary',
        'http://www.urbandictionary.com/favicon.ico',
        'http://www.urbandictionary.com/')
        .setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
        .setTitle(`${args.search} [${args.nummer + 1}/${res.body.list.length}]`)
        .setDescription('\u200b');
      const define = res.body.list[args.nummer].definition.match(/(.|[\r\n]){1,1024}/g);
      for (let i = 0; i < define.length; i++) { e.addField(i === 0 ? 'Definition' : '\u200b', define[i]); }
      const example = res.body.list[args.nummer].example.match(/(.|[\r\n]){1,1024}/g);
      if (example) {
        for (let i = 0; i < example.length; i++) e.addField(i === 0 ? 'Example' : '\u200b', example[i]);
      } else { e.addField('\u200b', '\u200b'); }
      e.setFooter(`${msg.content} | Definition ${args.nummer + 1} from ${res.body.list.length} Definitions.`, msg.author.avatarURL);
      return msg.embed(e);
    }
  }
};
