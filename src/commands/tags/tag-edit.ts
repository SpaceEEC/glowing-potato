import { GuildMember, Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagEdit extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			args: [
				{
					key: 'tag',
					prompt: 'which tag shall be edited?\n',
					type: 'validtag',
				},
				{
					key: 'content',
					max: 1800,
					prompt: 'how shall the new content look like?\n',
					type: 'tagcontent',
				},
			],
			description: 'Edits a tag.',
			examples: [
				'`tag-edit meme No longer only the finest memes here.`',
				'Edits the already existing tag with the name `meme` so it responds with `No longer only the finest memes here.`',
				'\nFor tags with names that contain spaces, omit all arguments. And enter name and content when being prompted to.',
			],
			group: 'tags',
			guildOnly: true,
			memberName: 'tag-edit',
			name: 'tag-edit',
		});
	}

	public async run(msg: CommandMessage, args: { tag: Tag, content: string }): Promise<Message | Message[]> {
		const member: GuildMember = await msg.guild.fetchMember(msg.author);

		const { content } = args;
		const { userID, name, guildID } = args.tag;

		const roles: string[] = this.client.provider.get(guildID, 'adminRoles', [])
			.concat(this.client.provider.get(guildID, 'modRoles', []));

		if (userID !== msg.author.id
			&& !member.hasPermission('ADMINISTRATOR')
			&& !this.client.isOwner(member)
			&& !msg.member.roles.some((r: Role) => roles.includes(r.id))
		) {
			throw new FriendlyError(`you can not edit the **${name}** tag, since it was not created by yourself!`);
		}
		await Tag.update({ content }, { where: { guildID, userID } });

		return msg.say(`The tag **${name}** has been updated.`);
	}
}
