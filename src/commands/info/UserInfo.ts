import { GuildMember, RichEmbed, User } from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Message, Middleware } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';

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
	public async action(message: Message, [res, user]: [BetterResourceProxy, User]): Promise<CommandResult>
	{
		const member: GuildMember = await message.guild.fetchMember(user).catch(() => undefined);

		const createdAt: string = moment(user.createdTimestamp).utc().format(res.CMD_USERINFO_MOMENT_FORMAT());
		const createdAgo: string = (moment.duration(message.createdTimestamp - user.createdTimestamp, 'milliseconds') as any)
			.format(res.CMD_USERINFO_CREATE_OR_JOIN_FORMAT());

		const game: string = user.presence.game
			? res.CMD_USERINFO_GAMESTATUS(
				{
					name: user.presence.game.name,
					// super hacky
					streaming: String(user.presence.game.streaming || ''),
				})
			: res.CMD_USERINFO_N_A();

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
			res.CMD_USERINFO_GLOBAL_TITLE(),
			res.CMD_USERINFO_GLOBAL_VALUE(
				{
					avatarURL: user.avatarURL
						? res.CMD_USERINFO_AVATAR({ avatar: user.avatarURL })
						: res.CMD_USERINFO_N_A(),
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
			const joinedAt: string = moment(member.joinedTimestamp).utc().format(res.CMD_USERINFO_MOMENT_FORMAT());
			const joinedAgo: string = (moment.duration(message.createdTimestamp - member.joinedTimestamp, 'milliseconds') as any)
				.format(res.CMD_USERINFO_CREATE_OR_JOIN_FORMAT());

			const roles: string[] = [];
			for (const role of member.roles.values())
			{
				// no everyone role
				if (role.id === message.guild.id) continue;
				roles.push(role.toString());
			}

			embed.addField(
				res.CMD_USERINFO_MEMBER_TITLE(),
				res.CMD_USERINFO_MEMBER_VALUE(
					{
						bot: String(user.bot || ''),
						joinedAgo,
						joinedAt,
						nickname: member.nickname || res.CMD_USERINFO_N_A(),
						roles: roles.join(', ') || res.CMD_USERINFO_N_A(),
					},
				),
				true,
			);
		}

		return embed;
	}
}
