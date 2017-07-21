import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { RichEmbed } from '../../structures/RichEmbed';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';
import { UrbanDefinition } from '../../types/UrbanDefinition';
import { UrbanResponse } from '../../types/UrbanResponse';

const { clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a definition from the urbandictionary.')
@name('urban')
@group('misg')
@guildOnly
@usage('<prefix>urban [-n] <...search>')
export default class Urban extends Command<Client>
{
	@using((msg: Message, args: string[]) =>
	{
		let pickedNumber: number = 0;
		if (args[0].match(/^-\d+$/g))
		{
			pickedNumber = parseInt(args.shift().slice(1)) - 1;
		}
		return [msg, [pickedNumber, args]];
	})
	@localizable
	@ReportError
	public async action(message: Message, [res, selectedNumber, search]: [ResourceLoader, number, string[]]): Promise<void>
	{
		const query: string = encodeURIComponent(search.join('+')).replace(/%2B/g, '+');

		const body: UrbanResponse = await get(`http://api.urbandictionary.com/v0/define?term=${query}`)
			.then((response: Result) => response.body as ProbablyNotABuffer);

		if (!body.list.length)
		{
			return message.channel.send(
				{
					embed:
					new RichEmbed()
						.setColor(0x1d2439)
						.setAuthor('Urbandictionary',
						'http://www.urbandictionary.com/favicon.ico',
						'http://www.urbandictionary.com/')
						// tslint:disable-next-line:max-line-length
						.setThumbnail('https://cdn.discordapp.com/attachments/242641288397062145/308943250465751041/eyJ1cmwiOiJodHRwOi8vaS5pbWd1ci5jb20vQ2NJWlpzYS5wbmcifQ.png')
						.addField('No results', 'Maybe made a typo?')
						.addField('Search:', `[URL](http://www.urbandictionary.com/define.php?term=${query})`)
						.setFooter(message.cleanContent, message.author.displayAvatarURL),
				},
			).then(() => undefined);
		}

		if (body.list.length < selectedNumber + 1) selectedNumber = body.list.length - 1;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x1d2439)
			.setAuthor('Urbandictionary',
			'http://www.urbandictionary.com/favicon.ico',
			'http://www.urbandictionary.com/')
			// tslint:disable-next-line:max-line-length
			.setThumbnail('https://cdn.discordapp.com/attachments/242641288397062145/308943250465751041/eyJ1cmwiOiJodHRwOi8vaS5pbWd1ci5jb20vQ2NJWlpzYS5wbmcifQ.png')
			.setTitle(`${search.join(' ')} [${selectedNumber + 1}/${body.list.length}]`)
			.setDescription('\u200b');

		const { example, definition }: UrbanDefinition = body.list[selectedNumber];

		embed.splitToFields('Defition', definition);

		if (example)
		{
			embed.splitToFields('Example', example);
		}

		embed.setFooter(`${message.cleanContent} | Definition ${selectedNumber + 1} from ${body.list.length} Definitions.`,
			message.author.displayAvatarURL);

		return message.channel.send({ embed })
			.then(() => undefined);
	}

}
