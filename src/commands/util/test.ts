import { Message, RichEmbedOptions } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class TestCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			name: 'test',
			aliases: ['bakaero'],
			group: 'util',
			memberName: 'test',
			description: 'test',
		});
	}

	public async run(msg: CommandMessage, args: {}): Promise<Message | Message[]> {
		return msg.embed(this._nichts(msg));
	}

	private _nichts(msg: CommandMessage): RichEmbedOptions {
		return {
			color: 0xFFFF00,
			author: {
				icon_url: this.client.user.displayAvatarURL,
				name: this.client.user.username,
			},
			fields: [
				{
					name: '¯\\_(ツ)_/¯',
					value: 'This command does nothing.\nBetter luck next time.',
				},
			],
			thumbnail: { url: this.client.user.displayAvatarURL },
			timestamp: new Date(),
			footer: {
				icon_url: msg.author.avatarURL,
				text: msg.cleanContent,
			},
		};
	}
}
