import { GuildMember, RichEmbed, User } from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Message, Middleware, ResourceLoader } from 'yamdbf';

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

		const createdAt: string = moment(user.createdTimestamp).utc().format(res('CMD_USERINFO_MOMENT_FORMAT'));
		const tmp: number = message.createdTimestamp - user.createdTimestamp;
		this.client.logger.warn('tmp', tmp.toLocaleString());
		const createdAgo: string = (moment.duration(tmp, 'milliseconds') as any)
			.format(res('CMD_USERINFO_CREATE_OR_JOIN_FORMAT'));

		const game: string = user.presence.game
			? res('CMD_USERINFO_GAMESTATUS',
				{
					name: user.presence.game.name,
					// super hacky
					streaming: String(user.presence.game.streaming || ''),
				})
			: res('CMD_USERINFO_N_A');

		let sharedGuilds: number = 0;
		for (const guild of this.client.guilds.values())
		{
			if (guild.members.has(user.id))++sharedGuilds;
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(member ? member.displayColor : 0xffa500)
			.setThumbnail(user.displayAvatarURL)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL)
			.addField(
			res('CMD_USERINFO_GLOBAL_TITLE'),
			res('CMD_USERINFO_GLOBAL_VALUE',
				{
					avatarURL: user.avatarURL
						? res('CMD_USER_INFO_AVATAR', { avatar: user.avatarURL })
						: res('CMD_USERINFO_N_A'),
					bot: String(user.bot || ''),
					createdAgo,
					createdAt,
					game,
					sharedGuilds: sharedGuilds.toLocaleString(),
					status: user.presence.status,
					tag: user.tag,
				},
			),
			true,
		);

		if (member)
		{
			const joinedAt: string = moment(member.joinedTimestamp).utc().format(res('CMD_USERINFO_MOMENT_FORMAT'));
			const tmp2: number = message.createdTimestamp - member.joinedTimestamp;
			this.client.logger.warn('tmp2', tmp2.toLocaleString());
			const joinedAgo: string = (moment.duration(tmp2, 'milliseconds') as any)
				.format(res('CMD_USERINFO_CREATE_OR_JOIN_FORMAT'));

			const roles: string[] = [];
			for (const role of member.roles.values())
			{
				// no everyone role
				if (role.id === message.guild.id) continue;
				roles.push(role.toString());
			}

			embed.addField(
				res('CMD_USERINFO_MEMBER_TITLE'),
				res('CMD_USERINFO_MEMBER_VALUE',
					{
						bot: String(user.bot || ''),
						joinedAgo,
						joinedAt,
						nickname: member.nickname || res('CMD_USERINFO_N_A'),
						roles: roles.join(', ') || res('CMD_USERINFO_N_A'),
					},
				),
				true,
			);
		}

		return message.channel.send({ embed }).then(() => undefined);

	}
}
