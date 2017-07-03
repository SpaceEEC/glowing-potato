import { Collection, GuildChannel, Role, Snowflake, TextChannel, Util as DJSUtil } from 'discord.js';
import { Message } from 'yamdbf/bin';

import { Client } from '../structures/Client';
import { GuildConfigChannels, GuildConfigRoles, GuildConfigStrings, GuildConfigType } from '../types/GuildConfigKeys';
import { Util } from './Util';

/**
 * Static GuildConfigUtil class holding useful methods and props to interact with the guild configs.
 * @static
 */
export class GuildConfigUtil
{
	/**
	 * All available config keys for all types.
	 * @static
	 */
	public static allConfigKeys: string[] = Object.keys(GuildConfigChannels).concat(
		Object.keys(GuildConfigRoles),
		Object.keys(GuildConfigStrings),
	);

	/**
	 * All available config values for all types.
	 * @static
	 */
	public static allConfigValues: string[] = Object.values(GuildConfigChannels).concat(
		Object.values(GuildConfigRoles),
		Object.values(GuildConfigStrings),
	);

	/**
	 * Tries to parse a string to their config type.
	 * Returns null when no suitable type was found.
	 * @param {string} key
	 * @returns {?GuildConfigType}
	 * @static
	 */
	public static parseConfigType(key: string): GuildConfigType
	{
		// string enums are not indexed with numbers <.<
		const uppercased: any = key.toUpperCase();
		if (GuildConfigChannels.hasOwnProperty(uppercased))
		{
			return GuildConfigType.CHANNEL;
		}
		if (GuildConfigRoles.hasOwnProperty(uppercased))
		{
			return GuildConfigType.ROLE;
		}
		if (GuildConfigStrings.hasOwnProperty(uppercased))
		{
			return GuildConfigType.STRING;
		}

		return null;
	}

	/**
	 * Parses the inputted string to it's correct string value.
	 * @param {string} key
	 * @returns {?string}
	 * @static
	 */
	public static parseConfigKey(key: string): string
	{
		// same here >.>
		const uppercased: any = key.toUpperCase();
		return GuildConfigChannels[uppercased]
			|| GuildConfigRoles[uppercased]
			|| GuildConfigStrings[uppercased]
			|| null;
	}

	/**
	 * Outputs a specific value from the config to the channel where the message comes from.
	 * @param {Message} message
	 * @param {string} key
	 * @param {GuildConfigType} type
	 * @param {any} [_] Not needed, just here for typescript
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async get(message: Message, key: string, type: GuildConfigType, _?: any): Promise<void>
	{
		const value: string = await message.guild.storage.get(key);
		if (!value)
		{
			return message.channel.send(`There is no ${key.toLowerCase()} set up.`)
				.then(() => undefined);
		}

		if (type === GuildConfigType.CHANNEL)
		{
			const channel: GuildChannel = message.guild.channels.get(value);
			if (!channel)
			{
				await message.guild.storage.remove(key);
				return message.channel
					.send(`The set up ${key.toLowerCase()} is no longer present and has been removed from the config.`)
					.then(() => undefined);
			}

			return message.channel.send(`The current ${key.toLowerCase()} is ${channel}.`)
				.then(() => undefined);
		}
		if (type === GuildConfigType.ROLE)
		{
			const role: Role = message.guild.roles.get(value);
			if (!role)
			{
				await message.guild.storage.remove(key);
				return message.channel
					.send(`The specified up \`${key.toLowerCase()}\` is no longer present and has been removed from the config.`)
					.then(() => undefined);
			}

			return message.channel.send(`The current \`${key.toLowerCase()}\` is \`@${role.name}}\``)
				.then(() => undefined);
		}
		if (type === GuildConfigType.STRING)
		{
			return message.channel
				.send(`The current \`${key.toLowerCase()}\` is \`\`\`${DJSUtil.escapeMarkdown(value, true)}\`\`\``)
				.then(() => undefined);
		}
	}

	/**
	 * Sets or updates the specified key into the guild config.
	 * @param {Message} message
	 * @param {string} key
	 * @param {GuildConfigType} type
	 * @param {GuildChannel | Role | string} value
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async set(message: Message, key: string, type: GuildConfigType, value: any)
		: Promise<void>
	{
		if (type === GuildConfigType.CHANNEL)
		{
			if (!(value instanceof TextChannel))
			{
				return message.channel.send(`The ${key.toLowerCase()} must be a text channel!`)
					.then(() => undefined);
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(`The ${key.toLowerCase()} is now ${value}`)
				.then(() => undefined);
		}
		if (type === GuildConfigType.ROLE)
		{
			if (!(value instanceof Role))
			{
				throw new Error('The value is not a role.\n\nNote: This should never happen!');
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(`The ${key.toLowerCase()} is now \`@${value.name}\``)
				.then(() => undefined);
		}
		if (type === GuildConfigType.STRING)
		{
			if (typeof value !== 'string')
			{
				throw new Error('The value is not a string.\n\nNote: This should never happen!');
			}
			await message.guild.storage.set(key, value);

			return message.channel.send(`The ${key.toLowerCase()} is now \`\`\`\n${DJSUtil.escapeMarkdown(value, true)}\`\`\``)
				.then(() => undefined);
		}
	}

	/**
	 * Resets the specified key, prompts the user to confirm.
	 * @param {Message} message
	 * @param {string} key´
	 * @param {GuildConfigType} [_] Not needed, just here for typescript
	 * @param {any} [__] Not needed, just here for typescript
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async reset(message: Message, key: string, _?: GuildConfigType, __?: any): Promise<void>
	{
		const prompt: Message = await message.channel.send(`Are you sure you want to reset the \`${key}\`?\n`
			+ '__y__es / __n__o\n\n'
			+ 'This prompt will be automatically canceled in \`30\` seconds.') as Message;
		const response: Message = await message.channel.awaitMessages(
			(m: Message) => m.author.id === message.author.id,
			{ maxMatches: 1, time: 3e4 },
		).then((collected: Collection<Snowflake, Message>) => collected.first());

		prompt.delete().catch(() => undefined);
		if (response && response.deletable) response.delete().then(() => undefined);

		if (!response || !['y', 'yes'].includes(response.content.toLowerCase()))
		{
			return message.channel.send('Aborting then...')
				.then(() => undefined);
		}

		await message.guild.storage.remove(key);

		return message.channel.send(`The \`${key}\` has been reset!`)
			.then(() => undefined);
	}

	/**
	 * Shortcut to `Util.client`
	 * @readonly
	 * @static
	 */
	public static get client(): Client
	{
		return Util.client;
	}
}
