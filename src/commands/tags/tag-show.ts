import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { Tag } from '../../dataProviders/models/Tag';

export default class TagShow extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'tag',
			group: 'tags',
			memberName: 'tag',
			description: 'Shows a tag.',
			guildOnly: true,
			args: [
				{
					key: 'tag',
					prompt: 'which tag do you like to see?\n',
					type: 'validtag',
				},
			],
			argsPromptLimit: 1
		});
	}

	public async run(msg: CommandMessage, args: { tag: Tag }): Promise<Message | Message[]> {
		return msg.say(args.tag.content);
	}
};
