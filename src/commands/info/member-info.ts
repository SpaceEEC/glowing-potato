import { stripIndents } from 'common-tags';
import { GuildMember, Message, RichEmbed, Role, User } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
moment.locale('de');

export default class MemberInfoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'member-info',
			aliases: ['user-info'],
			group: 'info',
			memberName: 'member-info',
			description: 'General information about the specified member.',
			guildOnly: true,
			args: [
				{
					key: 'member',
					label: 'Member',
					prompt: 'which members information would you like to see?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { member: GuildMember }): Promise<Message | Message[]> {
		const member: GuildMember = args.member || msg.member;
		const user: User = member.user;

		return msg.embed(new RichEmbed()
			.setColor(0xffa500).setAuthor('Stats', user.displayAvatarURL, user.displayAvatarURL)
			.setDescription(member.toString())
			.addField('❯ User information', stripIndents`• Avatar: ${user.avatarURL ? `[Link](${user.avatarURL})` : 'No Avatar'}
		• Created: ${moment(user.createdAt).format('DD.MM.YYYY')}
		• Status: \`${user.presence.status}\`
        • Game: \`${user.presence.game ? user.presence.game.name : 'none'}\``, true)
			.addField('❯ Server information:', stripIndents`${
				member.nickname ? `• Nickname: \`${member.nickname}\`` : ''}
		• Joined: ${moment(member.joinedAt).format('DD.MM.YYYY')}
		• roles: ${member.roles.filter((r: Role) => r.id !== member.guild.id).map((r: Role) => r.toString()).join(' ')}`, true)
			.setThumbnail(user.displayAvatarURL)
			.setTimestamp()
			.setFooter(msg.cleanContent, msg.author.displayAvatarURL));
	}
};
