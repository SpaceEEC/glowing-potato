import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'superagent';

export default class UrbanCommand extends Command {
	constructor(client: CommandoClient) {
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

	public async run(msg: CommandMessage, args: { search: string, number: number }): Promise<Message | Message[]> {
		if (args.search.split(' ')[0].match(/^-\d+$/g)) {
			args.number = parseInt(args.search.split(' ')[0].replace('-', ''));
			args.search = args.search.split(' ').slice(1).join(' ');
		} else { args.number = 1; }
		const res: request.Response = await request.get(`http://api.urbandictionary.com/v0/define?term=${args.search.split(' ').join('+')}`)
			.send(null).set('Content-Type', 'application/json');
		args.number -= 1;
		if (res.body.list.length === 0) {
			return msg.embed(
				new RichEmbed()
					.setColor(0x1d2439)
					.setAuthor('Urbandictionary',
					'http://www.urbandictionary.com/favicon.ico',
					'http://www.urbandictionary.com/')
					.setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
					.addField('No results', 'Maybe made a typo?')
					.addField('Search:', `[URL](http://www.urbandictionary.com/define.php?term=${args.search.split(' ').join('+')})`)
					.setFooter(msg.content, msg.author.avatarURL)
			);
		} else {
			if (!res.body.list[args.number]) {
				args.number = res.body.list.length - 1;
			}
			const e: RichEmbed = new RichEmbed()
				.setColor(0x1d2439)
				.setAuthor('Urbandictionary',
				'http://www.urbandictionary.com/favicon.ico',
				'http://www.urbandictionary.com/')
				.setThumbnail('http://puu.sh/tiNHS/3ae29d9b91.png')
				.setTitle(`${args.search} [${args.number + 1}/${res.body.list.length}]`)
				.setDescription('\u200b');
			const define: string = res.body.list[args.number].definition.match(/(.|[\r\n]){1,1024}/g);
			for (let i: number = 0; i < define.length; i++) { e.addField(i === 0 ? 'Definition' : '\u200b', define[i]); }
			const example: string = res.body.list[args.number].example.match(/(.|[\r\n]){1,1024}/g);
			if (example) {
				for (let i: number = 0; i < example.length; i++) e.addField(i === 0 ? 'Example' : '\u200b', example[i]);
			} else { e.addField('\u200b', '\u200b'); }
			e.setFooter(`${msg.content} | Definition ${args.number + 1} from ${res.body.list.length} Definitions.`, msg.author.avatarURL);
			return msg.embed(e);
		}
	}
};
