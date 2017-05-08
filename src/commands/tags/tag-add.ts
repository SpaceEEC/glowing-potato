import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagAdd extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'tag-add',
			group: 'tags',
			memberName: 'tag-add',
			description: 'Adds a tag.',
			examples: [
				'`tag-add meme Only the finest memes here`',
				'Adds a tag with the name `meme` and the content `Only the finest memes here`',
				'\nFor tags with names that contain spaces, omit all arguments. And enter name and content when being prompted to.'
			],
			guildOnly: true,
			args: [
				{
					key: 'name',
					prompt: 'how shall the tag be named?\n',
					type: 'validtag',
					max: 1
					// max = new, because reasons
					// also lowercases
				},
				{
					key: 'content',
					prompt: 'what shall the content be?\n',
					type: 'tagcontent',
					max: 1800
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { name: string, content: string }): Promise<Message | Message[]> {
		const { name, content } = args;

		await Tag.create({ name, guildID: msg.guild.id, userID: msg.author.id, content });

		return msg.say(`Tag **${name}** sucessfully created!`);
	}
};
