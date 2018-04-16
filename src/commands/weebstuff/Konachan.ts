import { RichEmbed } from 'discord.js';
import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, Middleware, ResourceProxy } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
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
		if (tags.length > 5) throw new Error(res.CMD_KONACHAN_TOO_MUCH_TAGS());
		return [msg, [res, encodeURIComponent(tags.join(' '))]];
	})
	@ReportError
	public async action(message: Message, [res, search]: [ResourceProxy<S>, string]): Promise<CommandResult>
	{
		const posts: PicturePost[] = await get(`http://konachan.com/post.json?tags=${search}+rating:s&limit=100`)
			.then<ProbablyNotABuffer>((result: Result) => result.body);

		if (!posts.length)
		{
			return new RichEmbed().setColor(0xFFFF00)
					.setAuthor('konachan.net', 'https://konachan.net/favicon.ico', 'https://konachan.net/')
					.addField(res.CMD_NO_RESULTS_TITLE(), res.CMD_NO_RESULTS_VALUE())
					.addField(res.CMD_NO_RESULTS_SEARCH(),
					`[${res.CMD_NO_RESULTS_URL()}](http://konachan.net/post?tags=${search})`);
		}

		const post: PicturePost = posts[Math.floor(Math.random() * posts.length)];

		return new RichEmbed()
				.setColor(message.member.displayColor)
				.setImage(`https:${post.sample_url}`)
				.setDescription(`[${res.CMD_RESULTS_SOURCE()}](http://konachan.net/post/show/${post.id})`);
	}
}
