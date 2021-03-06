import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { RichEmbed } from '../../structures/RichEmbed';

const { desc, group, name, usage, localizable } = CommandDecorators;

@desc('Generates an invite for this bot.')
@name('invite')
@group('util')
@usage('<prefix>invite')
export default class InviteCommand extends Command<Client>
{
	@localizable
	@ReportError
	public async action(message: Message, [res]: [BetterResourceProxy]): Promise<CommandResult>
	{
		const invite: string = await this.client.generateInvite([
			'READ_MESSAGES',
			'SEND_MESSAGES',
			'MANAGE_MESSAGES',
			'EMBED_LINKS',
			'ATTACH_FILES',
			'EXTERNAL_EMOJIS',
			'ADD_REACTIONS',
			'CONNECT',
			'SPEAK',
			'USE_VAD', // is this even needed?
		]);

		const embed: RichEmbed = new RichEmbed()
			.setColor(7019884)
			.setAuthor(res.CMD_INIVTE_EMBED_AUTHOR(), null, invite)
			.setThumbnail(this.client.user.displayAvatarURL)
			.setDescription(res.CMD_INVITE_EMBED_DESCRIPTION({ url: invite }))
			.addField(res.CMD_INVITE_EMBED_FIELD_TITLE(), res.CMD_INVITE_EMBED_FIELD_VALUE());

		return embed;
	}
}
