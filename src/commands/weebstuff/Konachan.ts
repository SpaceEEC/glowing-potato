import { RichEmbed } from 'discord.js';
import { get, Result } from 'snekfetch';
import { Command, Message } from 'yamdbf/bin';
import { clientPermissions, desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';

import { Client } from '../../structures/Client';
import { ReportError } from '../../structures/ReportError';
import { PicturePost } from '../../types/PicturePost';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from konachan.net')
@name('konachan')
@group('weebstuff')
@guildOnly
@usage('<prefix>konachan <...tags>')
export default class KonachanCommand extends Command<Client>
{
	@using((message: Message, tags: string[]) =>
	{
		if (tags.length > 5) throw new Error('You can not search with more than five tags!');
		return [message, [encodeURIComponent(tags.join(' '))]];
	})
	@ReportError
	public async action(message: Message, [tags]: [string]): Promise<void>
	{
		const posts: PicturePost[] = await get(`http://konachan.com/post.json?tags=${tags}+rating:s&limit=100`)
			.then<PicturePost[]>((result: Result) => result.body as ProbablyNotABuffer);

		if (!posts.length)
		{
			return message.channel.send({
				embed: new RichEmbed().setColor(0xFFFF00)
					.setAuthor('konachan.net', 'https://konachan.net/', 'https://konachan.net/favicon.ico')
					.addField('No results', 'Maybe made a typo?')
					.addField('Search:', `[Link](http://konachan.net/post?tags=${tags})`),
			}).then(() => undefined);
		}

		const post: PicturePost = posts[Math.floor(Math.random() * posts.length)];

		return message.channel.send({
			embed: new RichEmbed()
				.setColor(message.member.displayColor)
				.setImage(`https:${post.sample_url}`)
				.setDescription(`[Source](http://konachan.net/post/show/${post.id})`),
		}).then(() => undefined);
	}
}
