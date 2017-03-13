const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const request = require('superagent');
const { getUsedAlias } = require('../../util/util.js');

module.exports = class PictureCommand extends Command {
	constructor(client) {
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

	async run(msg, args) {
		if (!args.search.match(/^[a-z0-9_=()!-:.]+$/i)) {
			return msg.embed(new Embed().setColor(0xff0000)
				.setColor(0xff0000)
				.setDescription('Not allowed char in the search!')
				.addField('Allowed chars:', 'A-z 0-9 _ = () ! - : .', true));
		}

		msg.cmd = getUsedAlias(msg, { pic: 'picture' });
		args.search = args.search.split(' ');

		if (msg.cmd === 'picture') {
			if (args.search[2]) msg.cmd = 'konachan';
			else msg.cmd = ['konachan', 'donmai'][Math.floor(Math.random() * 2)];
		}
		return this[msg.cmd](msg, args.search.join('+'));
	}

	async konachan(msg, search) {
		const res = await request.get(`http://konachan.com/post.json?tags=${`${search}+rating:s&limit=100`}`)
			.send(null).set('Accept', 'application/json');

		if (res.body.length === 0) {
			return msg.embed(new Embed().setColor(0xFFFF00)
				.setAuthor('konachan.net', 'http://konachan.net/', 'http://konachan.net/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://konachan.net/post?tags=${search})`));
		}

		const image = res.body[Math.floor(Math.random() * (res.body.length - 0)) + 0];
		return msg.embed(new Embed()
			.setColor(msg.member.displayColor).setImage(`http:${image.sample_url}`)
			.setDescription(`[Source](http://konachan.net/post/show/${image.id})`));
	}

	async donmai(msg, search) {
		const res = await request.get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${search}`)
			.send(null).set('Accept', 'application/json');

		if (res.body.success === false) return msg.channel.send(`Der Server meldet:\n\`${res.body.message}\``);

		if (res.body.length === 0) {
			return msg.embed(new Embed().setColor(0xFFFF00)
				.setAuthor('safebooru.donmai.us', 'http://safebooru.donmai.us/', 'http://safebooru.donmai.us/favicon.ico')
				.addField('No results', 'Maybe made a typo?')
				.addField('Search:', `[Link](http://safebooru.donmai.us/posts/?tags=${search})`));
		}

		return msg.embed(new Embed().setColor(msg.member.displayColor)
			.setDescription(`[Source](http://safebooru.donmai.us/posts/${res.body[0].id}/)`)
			.setImage(`http://safebooru.donmai.us/${res.body[0].file_url}`));
	}

};
