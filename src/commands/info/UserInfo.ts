import { GuildMember, RichEmbed, Role, User } from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Guild, Message, Middleware, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;
const { expect, resolve } = Middleware;

@aliases('user')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays info for the specified user.')
@name('userinfo')
@group('info')
@guildOnly
@usage('<prefix>userinfo <User>')
export default class UserInfoCommand extends Command<Client>
{
	@using(resolve({ '<User>': 'User' }))
	@using(expect({ '<User>': 'User' }))
	@localizable
	@ReportError
	public async action(message: Message, [res, user]: [ResourceLoader, User]): Promise<void>
	{
		const member: GuildMember = await message.guild.fetchMember(user).catch(() => undefined);

		const createdAt: string = moment(user.createdTimestamp).utc().format('DD.MM.YYYY hh:mm:ss [[UTC]]');
		const createdSince: string = moment(user.createdTimestamp).fromNow();

		const gameStatus: string = user.presence.game
			? `, currently ${user.presence.game.streaming ? 'streaming' : 'playing'}: ${user.presence.game.name}`
			: '';
		const sharedGuilds: number = this.client.guilds
			.reduce((acc: number, guild: Guild) =>
				acc += +guild.members.has(user.id),
			0,
		);

		const embed: RichEmbed = new RichEmbed()
			.setColor(member ? member.displayColor : 0xffa500)
			.setThumbnail(user.displayAvatarURL)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL)

			.addField('❯ Global',
			`• \`${user.tag}\`, ${user.presence.status} ${gameStatus}\n`
			+ `${user.avatarURL ? `• Avatar: [click me](${user.avatarURL})\n` : ''}`
			+ `${sharedGuilds ? `• Shared guilds: \`${sharedGuilds}\`\n` : ''}`
			+ `• ${user.bot ? 'Created' : 'Registered account'} ${createdSince}.\n`
			+ `  (${createdAt})\n`,
		);

		if (member)
		{
			const joinedAt: string = moment(member.joinedTimestamp).utc().format('DD.MM.YYYY hh:mm:ss [[UTC]]');
			const joinedSince: string = moment(member.joinedTimestamp).fromNow();

			const roles: string = member.roles
				.reduce((acc: string[], role: Role) =>
				{
					if (role.id !== message.guild.id)
					{
						acc.push(role.toString());
					}
					return acc;
				},
				[],
			).join(', ');

			embed.addField('❯ Guild specific',
				`• Nickname: ${member.nickname || '`none`'}\n`
				+ `• Roles: ${roles}\n`
				+ `• ${user.bot ? 'Invited to' : 'Joined'} this guild ${joinedSince}.\n`
				+ `  (${joinedAt})\n`,
			);
		}

		return message.channel.send({ embed }).then(() => undefined);

	}
}
