const { Command } = require('discord.js-commando');

module.exports = class Tag extends Command {
	constructor(client) {
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
			]
		});
	}

	async run(msg, args) {
		msg.say(args.tag.dataValues.content);
	}
};
