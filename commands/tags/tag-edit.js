const { Command, FriendlyError } = require('discord.js-commando');
const { join } = require('path');
const tag = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'Tag'));

module.exports = class TagEdit extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-edit',
			group: 'tags',
			memberName: 'tag-edit',
			description: 'Edits a tag.',
			examples: [
				'`tag-edit meme No longer only the finest memes here.`',
				'Edits the already existing tag with the name `meme` so it responds with `No longer only the finest memes here.`',
				'\nFor tags with names that contain spaces, omit all arguments. And enter name and content when being prompted to.'
			],
			guildOnly: true,
			args: [
				{
					key: 'tag',
					prompt: 'which tag shall be edited?\n',
					type: 'validtag',
				},
				{
					key: 'content',
					prompt: 'how shall the new content look like?\n',
					type: 'tagcontent',
					max: 1800
				}
			]
		});
	}

	async run(msg, args) {
		const member = await msg.guild.fetchMember(msg.author);

		const { id: guildID } = msg.guild;
		const { content } = args;
		const { userID, name } = args.tag;

		const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));

		if (userID !== msg.author.id && !member.hasPermission('ADMINISTRATOR') && !this.client.isOwner(member) && !msg.member.roles.some(r => roles.includes(r.id))) {
			throw new FriendlyError(`you can not edit the **${name}** tag, since it was not created by yourself!`);
		}
		await tag.update({ content }, { where: { guildID, userID } });

		msg.say(`The tag **${name}** has been updated.`);
	}
};
