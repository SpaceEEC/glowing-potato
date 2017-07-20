import {
	Collection,
	Emoji,
	Invite,
	PartialGuild,
	PartialGuildChannel,
	RichEmbed,
	Role,
	SnowflakeUtil,
} from 'discord.js';
import * as moment from 'moment';
import { CommandDecorators, Guild, Message } from 'yamdbf';

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
	public action(message: Message, [input]: [string]): Promise<void>
	{
		return this._resolveGuild(message, input)
			.catch(() => message.channel.send('Could not resolve the provided ID or invite code to a guild.'))
			.then(() => undefined);
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

		const roles: string = guild.roles
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

		const created: moment.Moment = moment(guild.createdTimestamp);

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setDescription('\u200b')
			.setTitle(`Information about ${guild.name}`)
			.setThumbnail(guild.iconURL)
			.addField('❯ Channel:',
			`• \`${channels.text}\` text channels\n`
			+ `• \`${channels.voice}\` voice channels`, true)
			.addField('❯ Member:', `\`${guild.memberCount}\` total members\n`
			+ `Owner is ${guild.owner}`, true)
			.addField('❯ Created:',
			`Roughly ${created.utc().fromNow()}\n`
			+ `(${created.format('DD.MM.YYYY hh:mm:ss [[UTC]]')})`, true)
			.addField('❯ Region:',
			guild.region[0].toUpperCase() + guild.region.slice(1), true)
			.addField('❯ Roles:',
			`• \`${guild.roles.size}\`: ${roles}`.slice(0, 1024), true)
			.addField('❯ Emojis:', this._getRandomEmojis(guild.emojis) || '`none`', true)
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
			? Endpoints.Guild(guild).Icon((this.client.options as any).http.cdn, guild.icon)
			: null;

		const created: moment.Moment = moment(SnowflakeUtil.deconstruct(guild.id).timestamp);

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setDescription('\u200b')
			.setTitle(`(Partial Guild) Information about ${guild.name}`)
			.setThumbnail(iconURL)
			.addField('❯ Default Channel:', channel.name, true)
			.addField('❯ Online / Total Members:',
			`${presenceCount} / ${memberCount}`, true)
			.addField('❯ Created:',
			`Roughly ${created.utc().fromNow()}\n`
			+ `(${created.format('DD.MM.YYYY hh:mm:ss [[UTC]]')})`, true)
			.setTimestamp()
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send({ embed })
			.then(() => undefined);
	}

	private _resolveGuild(message: Message, input: string): Promise<void>
	{
		if (!input) return this._sendFullGuild(message, message.guild);

		if (this.client.guilds.has(input))
		{
			return this._sendFullGuild(message, this.client.guilds.get(input));
		}

		return this.client.fetchInvite(input)
			.then((invite: Invite) =>
			{
				if (invite.guild instanceof Guild) return this._sendFullGuild(message, invite.guild);
				return this._sendPartialGuild(message, invite);
			},
		);
	}

	private _getRandomEmojis(emojiCollection: Collection<string, Emoji>): string
	{
		const emojis: string[] = emojiCollection.map((e: Emoji) => e.toString());

		for (let i: number = emojis.length - 1; i > 0; --i)
		{
			const r: number = Math.floor(Math.random() * (i + 1));
			const t: string = emojis[i];
			emojis[i] = emojis[r];
			emojis[r] = t;
		}

		let mappedEmojis: string = '';
		for (const emoji of emojis)
		{
			if (mappedEmojis.length + emoji.length > 1021)
			{
				mappedEmojis += '...';
				break;
			}
			mappedEmojis += ` ${emoji}`;
		}

		return mappedEmojis;
	}
}
