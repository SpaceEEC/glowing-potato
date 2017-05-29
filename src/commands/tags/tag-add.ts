import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagAdd extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['addtag'],
			args: [
				{
					key: 'name',
					max: 1,
					// max = new, because reasons
					// also lowercases
					prompt: 'how shall the tag be named?\n',
					type: 'validtag',

				},
				{
					key: 'content',
					max: 1800,
					prompt: 'what shall the content be?\n',
					type: 'tagcontent',
				},
			],
			description: 'Adds a tag.',
			examples: [
				'`tag-add meme Only the finest memes here`',
				'Adds a tag with the name `meme` and the content `Only the finest memes here`',
				'\nFor tags with names that contain spaces, omit all arguments. And enter name and content when being prompted to.',
			],
			group: 'tags',
			guildOnly: true,
			memberName: 'tag-add',
			name: 'tag-add',
		});
	}

	public async run(msg: CommandMessage, args: { name: string, content: string }): Promise<Message | Message[]> {
		const { name, content } = args;

		await Tag.create({ name, guildID: msg.guild.id, userID: msg.author.id, content });

		return msg.say(`Tag **${name}** sucessfully created!`);
	}
}
