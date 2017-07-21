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
	SnowflakeUtil,
} from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage } = CommandDecorators;
// tslint:disable-next-line:variable-name
const { Endpoints }: { Endpoints: any } = require('discord.js').Constants;

@aliases('guild')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays info for the current or specified guild.')
@name('guildinfo')
@group('info')
@guildOnly
@usage('<prefix>guildinfo [ID | Invite]')
export default class GuildInfo extends Command<Client>
{
	@ReportError
	public async action(message: Message, [input]: [string]): Promise<void>
	{
		try
		{
			const guildOrInvite: Guild | Invite = await this._resolveInput(message, input);

			if (guildOrInvite instanceof Guild) return this._sendFullGuild(message, guildOrInvite);
			return this._sendPartialGuild(message, guildOrInvite);
		}
		catch (error)
		{
			if (error instanceof DiscordAPIError && error.code === 10006)
			{
				return message.channel.send('Could not resolve the provided ID or invite code to a guild.')
					.then(() => undefined);
			}

			throw error;
		}
	}

	private _sendFullGuild(message: Message, guild: Guild): Promise<void>
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

		const roles: string[] = [];
		for (const role of guild.roles.values())
		{
			// no everyone role
			if (role.id === message.guild.id) continue;
			roles.push(role.toString());
		}

		const created: moment.Moment = moment(guild.createdTimestamp);
		const onlineMembers: number = guild.members
			.filter((member: GuildMember) => member.presence.status !== 'offline')
			.size;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setDescription('\u200b')
			.setTitle(`Information about ${guild.name}`)
			.setThumbnail(guild.iconURL)
			.addField('❯ Channels:',
			[
				`• Default: ${guild.defaultChannel}`,
				`• Text: \`${channels.text}\``,
				`• Voice: \`${channels.voice}\``,
			],
			true)
			.addField('❯ Members:',
			[
				`• Owner: ${guild.owner || this.client.users.get(guild.ownerID).tag}`,
				`• Total: \`${guild.memberCount}\``,
				`• Online: \`${onlineMembers}\` (Note: This may be wrong in large guilds duo cache.)`,
			],
			true)
			.addField('❯ Created:',
			[
				`• Relative: ${created.utc().fromNow()}`,
				`• Absolute: ${created.format('DD.MM.YYYY hh:mm:ss [[UTC]]')}`,
			],
			true)
			.addField('❯ Region:', `• ${guild.region[0].toUpperCase() + guild.region.slice(1)}`, true)
			.addField('❯ Roles:',
			[
				`• Total: \`${guild.roles.size - 1 || 'none'}\``,
				`• List: ${roles.join(', ') || '`none`'}`,
			].join('\n').slice(0, 2000),
			true)
			.addField('❯ Emojis:', this._mapCollection<string, Emoji>(guild.emojis, true) || '`none`', true)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send({ embed })
			.then(() => undefined);
	}

	private _sendPartialGuild(message: Message, { channel, guild, memberCount, presenceCount }:
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
			.setTitle(`Information about ${guild.name}`)
			.setDescription('(Partial Guild)')
			.setThumbnail(iconURL)
			.addField('❯ Default Channel:',
			[
				`• Name: \`${channel.name}\``,
				`• Mention: #<${channel.id}> (Note: This mention only works when you are in the guild.)`,
			],
			true)
			.addField('❯ Members:',
			[
				`• Total: \`${memberCount}\``,
				`• Online: \`${presenceCount}\``,
			],
			true)
			.addField('❯ Created:',
			[
				`• Relative: ${createdAt.utc().fromNow()}`,
				`• Absolute: ${createdAt.format('DD.MM.YYYY hh:mm:ss [[UTC]]')}`,
			],
			true)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send({ embed })
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

	private _mapCollection<K = any, V = any>(collection: Collection<K, V>, random: boolean = false): string
	{
		const valueArray: string[] = [];
		for (const value of collection.values())
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
