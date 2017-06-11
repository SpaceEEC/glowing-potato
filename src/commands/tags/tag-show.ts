import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { Tag } from '../../dataProviders/models/Tag';

export default class TagShow extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['ahh'],
			args: [
				{
					key: 'tag',
					prompt: 'which tag do you like to see?\n',
					type: 'validtag',
					validate: () => true,
				},
			],
			description: 'Shows a tag.',
			group: 'tags',
			guildOnly: true,
			memberName: 'tag',
			name: 'tag',
		});
	}

	public async run(msg: CommandMessage, args: { tag: Tag }): Promise<Message | Message[]> {
		if (!args.tag) return null;
		return msg.say(args.tag.content);
	}
}
