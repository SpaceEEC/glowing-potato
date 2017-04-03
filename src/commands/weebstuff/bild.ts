import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'superagent';
import Util from '../../util/util';

type post = {
	id: number,
	sample_url: string,
	file_url: string
};

export default class PictureCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'picture',
			aliases: ['konachan', 'donmai', 'pic'],
			group: 'weebstuff',
			memberName: 'picture',
			description: 'Displays a picture konachan.net or safebooru.donmai.us',
			guildOnly: true,
			examples: [
				'`konachan polychromatic` Displays a random picture with that tag from konachan.net',
				'`donmai komeiji_satori` Displays a random picture with that tag from safebooru.donmai.us'
			],
			args: [
				{
					key: 'search',
					prompt: 'which tags shall be specified?\n',
					type: 'string',
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { search: string, cmd: string }): Promise<Message | Message[]> {
		if (!args.search.match(/^[a-z0-9_=()!-:.]+$/i)) {
			return msg.embed(new RichEmbed().setColor(0xff0000)
				.setColor(0xff0000)
				.setDescription('Not allowed char in the search!')
				.addField('Allowed chars:', 'A-z 0-9 _ = () ! - : .', true));
		}

		args.cmd = Util.getUsedAlias(msg, { pic: 'picture' });

		if (args.cmd === 'picture') {
			if (args.search.split(' ')[2]) args.cmd = 'konachan';
			else args.cmd = ['konachan', 'donmai'][Math.floor(Math.random() * 2)];
		}
		if (args.cmd === 'konachan') this.konachan(msg, args.search.split(' ').join('+'));
		else this.donmai(msg, args.search.split(' ').join('+'));
	}

	public async konachan(msg: CommandMessage, search: string): Promise<Message | Message[]> {
		const posts: post[] = (await request.get(`http://konachan.com/post.json?tags=${`${search}+rating:s&limit=100`}`)).body;
		if (posts.length === 0) {
			return msg.embed(new RichEmbed().setColor(0xFFFF00)
				.setAuthor('konachan.net', 'http://konachan.net/', 'http://konachan.net/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://konachan.net/post?tags=${search})`));
		}

		const post: post = posts[Math.floor(Math.random() * (posts.length - 0)) + 0];
		return msg.embed(new RichEmbed()
			.setColor(msg.member.displayColor).setImage(`http:${post.sample_url}`)
			.setDescription(`[Source](http://konachan.net/post/show/${post.id})`));
	}

	public async donmai(msg: CommandMessage, search: string): Promise<Message | Message[]> {
		const res: post[] = (await request.get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${search}`)).body;

		if (res.length === 0) {
			return msg.embed(new RichEmbed().setColor(0xFFFF00)
				.setAuthor('safebooru.donmai.us', 'http://safebooru.donmai.us/', 'http://safebooru.donmai.us/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://safebooru.donmai.us/posts/?tags=${search})`));
		}

		return msg.embed(new RichEmbed().setColor(msg.member.displayColor)
			.setDescription(`[Source](http://safebooru.donmai.us/posts/${res[0].id}/)`)
			.setImage(`http://safebooru.donmai.us/${res[0].file_url}`));
	}

};
