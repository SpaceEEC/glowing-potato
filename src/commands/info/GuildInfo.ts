import {
	Collection,
	DiscordAPIError,
	Emoji,
	Guild,
	GuildMember,
	Invite,
	PartialGuild,
	PartialGuildChannel,
	RichEmbed,
	Role,
	Snowflake,
	SnowflakeUtil,
} from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, localizable } = CommandDecorators;
// tslint:disable-next-line:variable-name
const { Endpoints }: { Endpoints: any } = require('discord.js').Constants;

@aliases('guild', 'guild-info', 'server', 'server-info', 'serverinfo')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays info for the current or specified guild.')
@name('guildinfo')
@group('info')
@guildOnly
@usage('<prefix>guildinfo [ID | Invite]')
export default class GuildInfo extends Command<Client>
{
	@localizable
	@ReportError
	public async action(message: Message, [res, input]: [ResourceLoader, string]): Promise<void>
	{
		try
		{
			const guildOrInvite: Guild | Invite = await this._resolveInput(message, input);

			if (guildOrInvite instanceof Guild) return this._sendFullGuild(message, res, guildOrInvite);
			return this._sendPartialGuild(message, res, guildOrInvite);
		}
		catch (error)
		{
			if (error instanceof DiscordAPIError && error.code === 10006)
			{
				return message.channel.send(res('CMD_GUILDINFO_RESOLVE_FAILED'))
					.then(() => undefined);
			}

			throw error;
		}
	}

	private _sendFullGuild(message: Message, res: ResourceLoader, guild: Guild): Promise<void>
	{
		const channels: {
			// just for typescript
			dm?: number,
			group?: number,
			// those are never present in a guild

			text: number,
			voice: number,
		} = { text: 0, voice: 0 };

		for (const channel of guild.channels.values())
		{
			++channels[channel.type];
		}

		const rolesCopy: Collection<Snowflake, Role> = guild.roles.clone();
		rolesCopy.delete(guild.id);
		const roles: string = this._mapIterator<Role>(rolesCopy.values());

		const createdAt: moment.Moment = moment(guild.createdTimestamp);
		const onlineMembers: number = guild.members
			.filter((member: GuildMember) => member.presence.status !== 'offline')
			.size;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setDescription('\u200b')
			.setTitle(res('CMD_GUILDINFO_EMBED_TITLE', { name: guild.name }))
			.setThumbnail(guild.iconURL)
			.addField(res('CMD_GUILDINFO_EMBED_FULL_CHANNELS_TITLE'),
			res('CMD_GUILDINFO_EMBED_FULL_CHANNELS_VALUE',
				{
					default: guild.channels.has(guild.id) ? guild.channels.get(guild.id).toString() : '`N/A`',
					text: channels.text.toLocaleString(),
					voice: channels.voice.toLocaleString(),
				},
			),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_BOTH_MEMBERS_TITLE'),
			res('CMD_GUILDINFO_EMBED_FULL_MEMBERS_VALUE',
				{
					online: onlineMembers.toLocaleString(),
					owner: guild.owner ? guild.owner.toString() : `\`${this.client.users.get(guild.ownerID).tag}\``,
					total: guild.memberCount.toLocaleString(),
				},
			),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_BOTH_CREATED_TITLE'),
			res('CMD_GUILDINFO_EMBED_BOTH_CREATED_VALUE',
				{
					absolute: createdAt.format('DD.MM.YYYY hh:mm:ss [[UTC]]'),
					relative: createdAt.utc().fromNow(),
				},
			),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_FULL_REGION_TITLE'),
			`• ${guild.region[0].toUpperCase() + guild.region.slice(1)}`,
			true)
			.addField(res('CMD_GUILDINFO_EMBED_FULL_ROLES_TITLE'),
			res('CMD_GUILDINFO_EMBED_FULL_ROLES_VALUE',
				{
					list: roles || '`none`',
					total: (guild.roles.size - 1 || 'none').toLocaleString(),
				},
			).slice(0, 1023),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_FULL_EMOJI_TITLE'),
			this._mapIterator<Emoji>(guild.emojis.values(), true) || '`none`',
			true)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send(embed)
			.then(() => undefined);
	}

	private _sendPartialGuild(message: Message, res: ResourceLoader, { channel, guild, memberCount, presenceCount }:
		{
			channel: PartialGuildChannel,
			guild: PartialGuild,
			memberCount: number,
			presenceCount: number,
		}): Promise<void>
	{
		const iconURL: string = guild.icon
			? Endpoints.Guild(guild).Icon(this.client.options.http.cdn, guild.icon)
			: null;

		const createdAt: moment.Moment = moment(SnowflakeUtil.deconstruct(guild.id).timestamp);

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setTitle(res('CMD_GUILDINFO_EMBED_TITLE', { name: guild.name }))
			.setDescription(res('CMD_GUILDINFO_EMBED_PARTIAL_DESCRIPTION'))
			.setThumbnail(iconURL)
			.addField(res('CMD_GUILDINFO_EMBED_PARTIAL_CHANNEL_TITLE'),
			res('CMD_GUILDINFO_EMBED_PARTIAL_CHANNEL_VALUE',
				{
					channel: `<#${channel.id}>`,
					name: channel.name,
				},
			),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_BOTH_MEMBERS_TITLE'),
			res('CMD_GUILDINFO_EMBED_PARTIAL_MEMBERS_VALUE',
				{
					memberCount: memberCount.toLocaleString(),
					presenceCount: presenceCount.toLocaleString(),
				},
			),
			true)
			.addField(res('CMD_GUILDINFO_EMBED_BOTH_CREATED_TITLE'),
			res('CMD_GUILDINFO_EMBED_BOTH_CREATED_VALUE',
				{
					absolute: createdAt.format('DD.MM.YYYY hh:mm:ss [[UTC]]'),
					relative: createdAt.utc().fromNow(),
				},
			),
			true)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send(embed)
			.then(() => undefined);
	}

	private async _resolveInput(message: Message, input: string): Promise<Guild | Invite>
	{
		if (!input) return message.guild;

		if (this.client.guilds.has(input))
		{
			return this.client.guilds.get(input);
		}

		const invite: Invite = await this.client.fetchInvite(input);

		if (invite.guild instanceof Guild) return invite.guild;
		return invite;
	}

	private _mapIterator<T = any>(iterator: IterableIterator<T>, random: boolean = false): string
	{
		const valueArray: string[] = [];
		for (const value of iterator)
		{
			valueArray.push(value.toString());
		}

		if (random)
		{
			for (let i: number = valueArray.length - 1; i > 0; --i)
			{
				const r: number = Math.floor(Math.random() * (i + 1));
				const t: string = valueArray[i];
				valueArray[i] = valueArray[r];
				valueArray[r] = t;
			}
		}

		let mappedValues: string = '';
		for (const value of valueArray)
		{
			if (mappedValues.length + value.length > 1021)
			{
				mappedValues += '...';
				break;
			}
			mappedValues += ` ${value}`;
		}

		return mappedValues;
	}
}
