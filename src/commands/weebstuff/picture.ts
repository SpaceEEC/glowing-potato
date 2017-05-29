import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { get, Result } from 'snekfetch';

import Util from '../../util/util';

type Post = {
	id: number;
	sample_url: string;
	file_url: string;
};

export default class PictureCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['konachan', 'donmai', 'pic'],
			args: [
				{
					default: '',
					key: 'search',
					parse: (value: string) => encodeURIComponent(value).replace(/%20/g, '+'),
					prompt: 'which tags shall be specified?\n',
					type: 'string',
				},
			],
			description: 'Displays a picture konachan.net or safebooru.donmai.us',
			examples: [
				'`konachan polychromatic` Displays a random picture with that tag from konachan.net',
				'`donmai komeiji_satori` Displays a random picture with that tag from safebooru.donmai.us',
			],
			group: 'weebstuff',
			guildOnly: true,
			memberName: 'picture',
			name: 'picture',
		});
	}

	public async run(msg: CommandMessage, args: { search: string, cmd: string }): Promise<Message | Message[]> {
		args.cmd = Util.getUsedAlias(msg, { pic: 'picture' });
		const tagAmount: number = args.search.split('+').length;

		if (tagAmount > 5) {
			return msg.say('You can not search for more than 5 tags.');
		}

		if (args.cmd === 'picture') {
			if (tagAmount > 2) args.cmd = 'konachan';
			else args.cmd = ['konachan', 'donmai'][Math.floor(Math.random() * 2)];
		} else if (args.cmd === 'donmai' && tagAmount > 2) {
			return msg.say('You can not search donmai with more than two tags.');
		}

		if (args.cmd === 'konachan') return this._konachan(msg, args.search.split(' ').join('+'));
		else if (args.cmd === 'donmai') return this._donmai(msg, args.search.split(' ').join('+'));
		throw new Error(`Unknown provider: ${args.cmd}`);
	}

	private async _konachan(msg: CommandMessage, search: string): Promise<Message | Message[]> {
		const posts: Post[] = await get(`http://konachan.com/post.json?tags=${search}+rating:s&limit=100`)
			.then<Post[]>((result: Result) => result.body as any);

		if (posts.length === 0) {
			return msg.embed(new RichEmbed().setColor(0xFFFF00)
				.setAuthor('konachan.net', 'http://konachan.net/', 'http://konachan.net/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://konachan.net/post?tags=${search})`));
		}

		const post: Post = posts[Math.floor(Math.random() * posts.length)];
		return msg.embed(new RichEmbed()
			.setColor(msg.member.displayColor).setImage(`http:${post.sample_url}`)
			.setDescription(`[Source](http://konachan.net/post/show/${post.id})`));
	}

	private async _donmai(msg: CommandMessage, search: string): Promise<Message | Message[]> {
		const posts: Post[] = await get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${search}`)
			.then<Post[]>((result: Result) => result.body as any);

		if (posts.length === 0) {
			return msg.embed(new RichEmbed().setColor(0xFFFF00)
				.setAuthor('safebooru.donmai.us', 'http://safebooru.donmai.us/', 'http://safebooru.donmai.us/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://safebooru.donmai.us/posts/?tags=${search})`));
		}

		return msg.embed(new RichEmbed().setColor(msg.member.displayColor)
			.setDescription(`[Source](http://safebooru.donmai.us/posts/${posts[0].id}/)`)
			.setImage(`http://safebooru.donmai.us/${posts[0].file_url}`));
	}
}
