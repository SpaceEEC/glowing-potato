import { Message, RichEmbedOptions } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class TestCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['bakaero'],
			description: 'test',
			group: 'util',
			memberName: 'test',
			name: 'test',
		});
	}

	public async run(msg: CommandMessage, args: {}): Promise<Message | Message[]> {
		return msg.embed(this._nichts(msg));
	}

	private _nichts(msg: CommandMessage): RichEmbedOptions {
		return {
			author: {
				icon_url: this.client.user.displayAvatarURL,
				name: this.client.user.username,
			},
			color: 0xFFFF00,
			fields: [
				{
					name: '¯\\_(ツ)_/¯',
					value: 'This command does nothing.\nBetter luck next time.',
				},
			],
			footer: {
				icon_url: msg.author.avatarURL,
				text: msg.cleanContent,
			},
			thumbnail: { url: this.client.user.displayAvatarURL },
			timestamp: new Date(),
		};
	}
}
