import { get, Result } from 'snekfetch';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { RichEmbed } from '../../structures/RichEmbed';
import { ProbablyNotABuffer } from '../../types/ProbablyNotABuffer';
import { UrbanDefinition } from '../../types/UrbanDefinition';
import { UrbanResponse } from '../../types/UrbanResponse';

const { expect } = Middleware;
const { clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays a definition from the urbandictionary.')
@name('urban')
@group('misc')
@guildOnly
@usage('<prefix>urban [-n] <...Search>')
export default class Urban extends Command<Client>
{
	@using(expect({ '<...Search>': 'String' }))
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
	public async action(message: Message, [res, selectedNumber, search]: [ResourceLoader, number, string[]])
	: Promise<CommandResult>
	{
		const query: string = encodeURIComponent(search.join('+')).replace(/%2B/g, '+');

		const body: UrbanResponse = await get(`http://api.urbandictionary.com/v0/define?term=${query}`)
			.then((response: Result) => response.body as ProbablyNotABuffer);

		if (!body.list.length)
		{
			return new RichEmbed()
					.setColor(0x1d2439)
					.setAuthor('Urbandictionary',
					'http://www.urbandictionary.com/favicon.ico',
					'http://www.urbandictionary.com/')
					.setThumbnail('https://a.safe.moe/7BZzg.png')
					.addField(res(S.CMD_NO_RESULTS_TITLE), res(S.CMD_NO_RESULTS_VALUE))
					.addField(res(S.CMD_NO_RESULTS_SEARCH),
					`[${res(S.CMD_NO_RESULTS_URL)}](http://www.urbandictionary.com/define.php?term=${query})`)
					.setFooter(message.cleanContent, message.author.displayAvatarURL);
		}

		if (body.list.length < selectedNumber + 1) selectedNumber = body.list.length - 1;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x1d2439)
			.setAuthor('Urbandictionary',
			'http://www.urbandictionary.com/favicon.ico',
			'http://www.urbandictionary.com/')
			.setThumbnail('https://a.safe.moe/7BZzg.png')
			.setTitle(`${search.join(' ')} [${selectedNumber + 1}/${body.list.length}]`)
			.setDescription('\u200b');

		const { example, definition }: UrbanDefinition = body.list[selectedNumber];

		embed.splitToFields(res(S.CMD_URBAN_DEFINITION), definition);

		if (example)
		{
			embed.splitToFields(res(S.CMD_URBAN_EXAMPLE), example);
		}

		embed.setFooter(
			res(S.CMD_URBAN_FOOTER,
				{
					content: message.cleanContent,
					definition: (selectedNumber + 1).toLocaleString(),
					maxDefinition: body.list.length.toLocaleString(),
				},
			),
			message.author.displayAvatarURL,
		);

		return embed;
	}

}
