import { TextChannel, Webhook } from 'discord.js';
import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { RichEmbed } from '../../structures/RichEmbed';

const { desc, group, name, ownerOnly, usage } = CommandDecorators;

@desc('Some generic test command.')
@name('test')
@group('util')
@ownerOnly
@usage('<prefix>test [...Maybe]')
export default class TestCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, code: string[]): Promise<void>
	{
		const webhook: Webhook = await (message.channel as TextChannel).fetchWebhooks().then((w: any) => w.first());
		webhook.send({ embeds: [new RichEmbed()] });
		throw Error('bork');
	}
}
