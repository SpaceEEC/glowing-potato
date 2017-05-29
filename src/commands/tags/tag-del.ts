import { GuildMember, Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

import Tag from '../../dataProviders/models/Tag';

export default class TagDel extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['deltag'],
			args: [
				{
					key: 'tag',
					prompt: 'which tag shall be deleted?\n',
					type: 'validtag',
				},
			],
			description: 'Deletes a tag.',
			examples: [
				'`tag-del meme`',
				'Deletes the tag `meme`.',
			],
			group: 'tags',
			guildOnly: true,
			memberName: 'tag-del',
			name: 'tag-del',
		});
	}

	public async run(msg: CommandMessage, args: { tag: Tag }): Promise<Message | Message[]> {
		const member: GuildMember = await msg.guild.fetchMember(msg.author);

		const { userID, name, guildID } = args.tag;

		const roles: string[] = this.client.provider.get(guildID, 'adminRoles', [])
			.concat(this.client.provider.get(guildID, 'modRoles', []));

		if (userID !== msg.author.id
			&& !member.hasPermission('ADMINISTRATOR')
			&& !this.client.isOwner(member)
			&& !msg.member.roles.some((r: Role) => roles.includes(r.id))
		) {
			throw new FriendlyError(`you can not delete the **${name}** tag, since it was not created by yourself!`);
		}
		await Tag.destroy({ where: { guildID, name } });

		return msg.say(`The tag **${name}** was deleted!`);
	}
}
