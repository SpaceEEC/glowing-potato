import { RichEmbed } from 'discord.js';
import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { PicturePost } from '../../types/PicturePost';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';

const { expect } = Middleware;
const { clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from safebooru.donmai.us')
@name('donmai')
@group('weebstuff')
@guildOnly
@usage('<prefix>donmai <...Tags>')
export default class DonmaiCommand extends Command<Client>
{
	@using(expect({ '<...Tags>': 'String' }))
	@localizable
	// tslint:disable-next-line:no-shadowed-variable
	@using((msg: Message, [res, ...tags]: any[]) =>
	{
		if (tags.length > 2) throw new Error(res('CMD_DONMAI_TOO_MUCH_TAGS'));
		return [msg, [res, encodeURIComponent(tags.join(' '))]];
	})
	@ReportError
	public async action(message: Message, [res, search]: [ResourceLoader, string]): Promise<void>
	{
		const posts: PicturePost[] = await get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${search}`)
			.then<ProbablyNotABuffer>((result: Result) => result.body);

		if (!posts.length)
		{
			return message.channel.send({
				embed: new RichEmbed()
					.setColor(0xFFFF00)
					.setAuthor('safebooru.donmai.us', 'https://safebooru.donmai.us/favicon.ico', 'https://safebooru.donmai.us/')
					.addField(res('CMD_NO_RESULTS_TITLE'), res('CMD_NO_RESULTS_VALUE'))
					.addField(res('CMD_NO_RESULTS_SEARCH'),
					`[${res('CMD_NO_RESULTS_URL')}](http://safebooru.donmai.us/posts/?tags=${search})`),
			}).then(() => undefined);
		}

		return message.channel.send({
			embed: new RichEmbed()
				.setColor(message.member.displayColor)
				.setImage(`http://safebooru.donmai.us/${posts[0].file_url}`)
				.setDescription(`[${res('CMD_RESULTS_SOURCE')}](http://safebooru.donmai.us/posts/${posts[0].id}/)`),
		}).then(() => undefined);
	}
}
