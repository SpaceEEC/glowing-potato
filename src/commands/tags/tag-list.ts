import { Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagList extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'tag-list',
			aliases: ['tags'],
			group: 'tags',
			memberName: 'tags-list',
			description: 'Lists all tags.',
			guildOnly: true,
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const tags: Tag[] = (await Tag.findAll({ where: { guildID: msg.guild.id } })).map((t: any) => t.dataValues);
		if (!tags.length) throw new FriendlyError(`no tags in this guild yet, be the first one to add one!`);

		let alle: string[] = tags.filter((t: Tag) => t.userID !== msg.author.id).map((t: Tag) => `\`${t.name}\``).sort();
		let user: string[] = tags.filter((t: Tag) => t.userID === msg.author.id).map((t: Tag) => `\`${t.name}\``).sort();

		if (!alle[0]) alle = ['All tags on this guild belongs to you! You can ask others to add tags too.'];
		if (!user[0]) user = ['You have not added any tags yet, go add some!'];

		return msg.embed(new RichEmbed().setTimestamp().setColor(0x3498db)
			.setFooter(`${msg.author.username}: ${msg.content}`, this.client.user.avatarURL)
			.addField(`${msg.author.username} tags:`, user.join(' '))
			.addField('Other tags:', alle.join(' '))
			.setThumbnail(this.client.user.avatarURL)
		);
	}
};
