import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
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
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
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
			'USE_VAD',
		]);

		const embed: RichEmbed = new RichEmbed()
			.setColor(7019884)
			.setAuthor('Invite', null, invite)
			.setThumbnail(this.client.user.displayAvatarURL)
			.setDescription([
				`To invite me to your server click this link [here](${invite}).`,
				'**Note**: You need the **Manage Guild** permission to add me.',
				'\u200b',
			])
			.addField('**Additional informations regarding the attached permissions:**',
			[
				'Those permissions are there to ensure I can work as expected.',
				'',
				'You don\'t have to entrust me with **Manage Messages** if you don\'t want to.',
				'I just won\'t be able to clean up after prompts, that\'s it!',
			]);

		return message.channel.send({ embed })
			.then(() => undefined);
	}
}
