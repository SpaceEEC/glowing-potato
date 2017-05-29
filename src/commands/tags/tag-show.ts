import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagShow extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			name: 'tag',
			aliases: ['ahh'],
			group: 'tags',
			memberName: 'tag',
			description: 'Shows a tag.',
			guildOnly: true,
			args: [
				{
					key: 'tag',
					prompt: 'which tag do you like to see?\n',
					type: 'validtag',
					validate: () => true,
				},
			],
		});
	}

	public async run(msg: CommandMessage, args: { tag: Tag }): Promise<Message | Message[]> {
		if (!args.tag) return null;
		return msg.say(args.tag.content);
	}
}
