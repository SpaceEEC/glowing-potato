const { Command } = require('discord.js-commando');
const { join } = require('path');
const tag = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'Tag'));

module.exports = class TagAdd extends Command {
	constructor(client) {
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
					// lowercases
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

	async run(msg, args) {
		const { name, content } = args;
		const { id: guildID } = msg.guild;
		const { id: userID } = msg.author;

		await tag.create({ name, guildID, userID, content });

		msg.say(`Tag **${name}** sucessfully created!`);
	}
};
