import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { get, Result } from 'snekfetch';

type UrbanResponse = {
	tags: string[];
	result_type: string;
	list: UrbanDefinition[];
	sounds: string[];
};

type UrbanDefinition = {
	definition: string;
	permalink: string;
	thumbs_up: number;
	author: string,
	word: string;
	defid: number;
	current_vote: string;
	example: string;
	thubms_down: number;
};

export default class UrbanCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'search',
					prompt: stripIndents`
						what would you like to look up?
						You can specify \`-n\` (n as a number) at the beginning to look up a specific definition.\n`,
					type: 'string',
				},
			],
			description: 'Displays a definition from urbandictionary.com .',
			group: 'miscellaneous',
			guildOnly: true,
			memberName: 'urban',
			name: 'urban',
		});
	}

	public async run(msg: CommandMessage, args: { search: string, number: number }): Promise<Message | Message[]> {
		if (args.search.split(' ')[0].match(/^-\d+$/g)) {
			args.number = parseInt(args.search.split(' ')[0].replace('-', '')) - 1;
			args.search = args.search.split(' ').slice(1).join(' ');
		} else { args.number = 0; }

		const body: UrbanResponse = await
			get(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.search.replace(/ /g, '+'))}`)
				// not a buffer
				.then<UrbanResponse>((response: Result) => response.body as any);

		if (body.list.length === 0) {
			return msg.embed(
				new RichEmbed()
					.setColor(0x1d2439)
					.setAuthor('Urbandictionary',
					'http://www.urbandictionary.com/favicon.ico',
					'http://www.urbandictionary.com/')
					// tslint:disable-next-line:max-line-length
					.setThumbnail('https://cdn.discordapp.com/attachments/242641288397062145/308943250465751041/eyJ1cmwiOiJodHRwOi8vaS5pbWd1ci5jb20vQ2NJWlpzYS5wbmcifQ.png')
					.addField('No results', 'Maybe made a typo?')
					.addField('Search:', `[URL](http://www.urbandictionary.com/define.php?term=${args.search.split(' ').join('+')})`)
					.setFooter(msg.cleanContent, msg.author.displayAvatarURL),
			);

		} else {
			if (!body.list[args.number]) args.number = body.list.length - 1;

			const e: RichEmbed = new RichEmbed()
				.setColor(0x1d2439)
				.setAuthor('Urbandictionary',
				'http://www.urbandictionary.com/favicon.ico',
				'http://www.urbandictionary.com/')
				// tslint:disable-next-line:max-line-length
				.setThumbnail('https://cdn.discordapp.com/attachments/242641288397062145/308943250465751041/eyJ1cmwiOiJodHRwOi8vaS5pbWd1ci5jb20vQ2NJWlpzYS5wbmcifQ.png')
				.setTitle(`${args.search} [${args.number + 1}/${body.list.length}]`)
				.setDescription('\u200b');

			const define: string | string[] = body.list[args.number].definition.match(/(.|[\r\n]){1,1024}/g);
			for (let i: number = 0; i < define.length; i++) e.addField(i === 0 ? 'Definition' : '\u200b', define[i]);

			const example: string | string[] = body.list[args.number].example.match(/(.|[\r\n]){1,1024}/g);
			if (example) for (let i: number = 0; i < example.length; i++) e.addField(i === 0 ? 'Example' : '\u200b', example[i]);
			else e.addField('\u200b', '\u200b');

			// tslint:disable-next-line:max-line-length
			e.setFooter(`${msg.cleanContent} | Definition ${args.number + 1} from ${body.list.length} Definitions.`, msg.author.displayAvatarURL);

			return msg.embed(e);
		}
	}
}
