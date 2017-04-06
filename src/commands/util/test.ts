import { Message, RichEmbedOptions } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class TestCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'test',
			aliases: ['bakaero'],
			group: 'util',
			memberName: 'test',
			description: 'A test command, usually does nothing.',
		});
	}

	public async run(msg: CommandMessage, args: {}): Promise<Message | Message[]> {
		return msg.embed(this.nichts(msg));
	}

	private nichts(msg: CommandMessage): RichEmbedOptions {
		return {
			color: 0xFFFF00,
			author: {
				icon_url: this.client.user.avatarURL,
				name: this.client.user.username,
			},
			fields: [
				{
					name: '¯\\_(ツ)_/¯',
					value: 'This command does nothing.\nBetter luck next time.',
				},
			],
			thumbnail: { url: this.client.user.avatarURL },
			timestamp: new Date(),
			footer: {
				icon_url: msg.author.avatarURL,
				text: msg.content,
			},
		};
	}

};
