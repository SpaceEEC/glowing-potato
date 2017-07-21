import { RichEmbed } from 'discord.js';
import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { PicturePost } from '../../types/PicturePost';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';

const { clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a random picture from safebooru.donmai.us')
@name('donmai')
@group('weebstuff')
@guildOnly
@usage('<prefix>donmai <...tags>')
export default class DonmaiCommand extends Command<Client>
{
	@localizable
	// tslint:disable-next-line:no-shadowed-variable
	@using((msg: Message, [res, ...tags]: any[]) =>
	{
		if (tags.length > 2) throw new Error('You can not search with more than two tags!');
		return [msg, [res, encodeURIComponent(tags.join(' '))]];
	})
	@ReportError
	public async action(message: Message, [res, search]: [ResourceLoader, string]): Promise<void>
	{
		const posts: PicturePost[] = await get(`http://safebooru.donmai.us/posts.json?limit=1&random=true&tags=${search}`)
			.then<PicturePost[]>((result: Result) => result.body as ProbablyNotABuffer);

		if (!posts.length)
		{
			return message.channel.send({
				embed: new RichEmbed()
					.setColor(0xFFFF00)
					.setAuthor('safebooru.donmai.us', 'https://safebooru.donmai.us/', '/https://safebooru.donmai.us/favicon.ico')
					.addField('No results', 'Maybe made a typo?')
					.addField('Search:', `[Link](http://safebooru.donmai.us/posts/?tags=${search})`),
			}).then(() => undefined);
		}

		return message.channel.send({
			embed: new RichEmbed()
				.setColor(message.member.displayColor)
				.setImage(`http://safebooru.donmai.us/${posts[0].file_url}`)
				.setDescription(`[Source](http://safebooru.donmai.us/posts/${posts[0].id}/)`),
		}).then(() => undefined);
	}
}
