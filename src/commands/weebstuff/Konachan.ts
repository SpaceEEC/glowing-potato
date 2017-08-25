import { RichEmbed } from 'discord.js';
import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { PicturePost } from '../../types/PicturePost';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';

const { expect } = Middleware;
const { clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from konachan.net')
@name('konachan')
@group('weebstuff')
@guildOnly
@usage('<prefix>konachan <...Tags>')
export default class KonachanCommand extends Command<Client>
{
	@using(expect({ '<...Tags>': 'String' }))
	@localizable
	// tslint:disable-next-line:no-shadowed-variable
	@using((msg: Message, [res, ...tags]: any[]) =>
	{
		if (tags.length > 5) throw new Error(res(S.CMD_KONACHAN_TOO_MUCH_TAGS));
		return [msg, [res, encodeURIComponent(tags.join(' '))]];
	})
	@ReportError
	public async action(message: Message, [res, search]: [ResourceLoader, string]): Promise<void>
	{
		const posts: PicturePost[] = await get(`http://konachan.com/post.json?tags=${search}+rating:s&limit=100`)
			.then<ProbablyNotABuffer>((result: Result) => result.body);

		if (!posts.length)
		{
			return message.channel.send(
				new RichEmbed().setColor(0xFFFF00)
					.setAuthor('konachan.net', 'https://konachan.net/favicon.ico', 'https://konachan.net/')
					.addField(res(S.CMD_NO_RESULTS_TITLE), res(S.CMD_NO_RESULTS_VALUE))
					.addField(res(S.CMD_NO_RESULTS_SEARCH),
					`[${res(S.CMD_NO_RESULTS_URL)}](http://konachan.net/post?tags=${search})`),
			).then(() => undefined);
		}

		const post: PicturePost = posts[Math.floor(Math.random() * posts.length)];

		return message.channel.send(
			new RichEmbed()
				.setColor(message.member.displayColor)
				.setImage(`https:${post.sample_url}`)
				.setDescription(`[${res(S.CMD_RESULTS_SOURCE)}](http://konachan.net/post/show/${post.id})`),
		).then(() => undefined);
	}
}
