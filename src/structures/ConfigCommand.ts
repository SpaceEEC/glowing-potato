import { Collection, GuildChannel, Role, Snowflake, TextChannel, Util as DJSUtil } from 'discord.js';
import { Message, ResourceLoader } from 'yamdbf';

import { GuildConfigType } from '../types/GuildConfigKeys';
import { Util } from '../util/Util';
import { Client } from './Client';
import { Command as AbstractCommand } from './Command';

abstract class Command<T extends Client = Client> extends AbstractCommand<T>
{
	/**
	 * Outputs a specific value from the config to the channel where the message comes from.
	 * @param {Message} message
	 * @param {ResourceLoader} res
	 * @param {string} key
	 * @param {GuildConfigType} type
	 * @param {any} [_] Just here for typescript
	 * @returns {Promise<void>}
	 * @protected
	 */
	protected async get(message: Message, res: ResourceLoader, key: string, type: GuildConfigType, _?: any): Promise<void>
	{
		const value: string = await message.guild.storage.get(key);
		if (!value)
		{
			return message.channel.send(res('CMD_CONFIG_KEY_NOT_SET_UP', { key: key.toLowerCase() }))
				.then(() => undefined);
		}

		if (type === GuildConfigType.CHANNEL)
		{
			const channel: GuildChannel = message.guild.channels.get(value);
			if (!channel)
			{
				await message.guild.storage.remove(key);
				return message.channel
					.send(res('CMD_CONFIG_NOT_PRESENT', { key: key.toLowerCase() }))
					.then(() => undefined);
			}

			return message.channel.send(
				res(
					'CMD_CONFIG_CURRENT_VALUE',
					{
						key: key.toLowerCase(),
						value: channel.toString(),
					},
				),
			).then(() => undefined);
		}
		if (type === GuildConfigType.ROLE)
		{
			const role: Role = message.guild.roles.get(value);
			if (!role)
			{
				await message.guild.storage.remove(key);
				return message.channel
					.send(res('CMD_CONFIG_NOT_PRESENT', { key: key.toLowerCase() }))
					.then(() => undefined);
			}

			return message.channel.send(
				res(
					'CMD_CONFIG_CURRENT_VALUE',
					{
						key: key.toLowerCase(),
						value: `\`@${role.name}}\``,
					},
				),
			).then(() => undefined);
		}
		if (type === GuildConfigType.STRING)
		{
			return message.channel.send(
				res(
					'CMD_CONFIG_CURRENT_VALUE',
					{
						key: key.toLowerCase(),
						value: `\`\`\`${DJSUtil.escapeMarkdown(value, true)}\`\`\``,
					},
				),
			).then(() => undefined);
		}
	}

	/**
	 * Sets or updates the specified key into the guild config.
	 * @param {Message} message
	 * @param {ResourceLoader} res
	 * @param {string} key
	 * @param {GuildConfigType} type
	 * @param {GuildChannel | Role | string} value
	 * @returns {Promise<void>}
	 * @protected
	 */
	protected async set(message: Message, res: ResourceLoader, key: string, type: GuildConfigType, value: any)
		: Promise<void>
	{
		if (type === GuildConfigType.CHANNEL)
		{
			if (!(value instanceof TextChannel))
			{
				return message.channel.send(res('CMD_CONFIG_VALUE_MUST_BE_TEXTCHANNEL', { key: key.toLowerCase() }))
					.then(() => undefined);
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(
				res(
					'CMD_CONFIG_VALUE_UPDATE',
					{
						key: key.toLowerCase(),
						value: value.toString(),
					},
				),
			).then(() => undefined);
		}
		if (type === GuildConfigType.ROLE)
		{
			if (!(value instanceof Role))
			{
				throw new Error('The value is not a role.\n\nNote: This should never happen!');
			}
			await message.guild.storage.set(key, value.id);

			return message.channel.send(
				res(
					'CMD_CONFIG_VALUE_UPDATE',
					{
						key: key.toLowerCase(),
						value: `\`@${value.name}\``,
					},
				),
			).then(() => undefined);
		}
		if (type === GuildConfigType.STRING)
		{
			if (typeof value !== 'string')
			{
				throw new Error('The value is not a string.\n\nNote: This should never happen!');
			}
			await message.guild.storage.set(key, value);

			return message.channel.send(
				res(
					'CMD_CONFIG_VALUE_UPDATE',
					{
						key: key.toLowerCase(),
						value: `\`\`\`${DJSUtil.escapeMarkdown(value, true)}\`\`\``,
					},
				),
			).then(() => undefined);
		}
	}

	/**
	 * Resets the specified key, prompts the user to confirm.
	 * @param {Message} message
	 * @param {ResourceLoader} res
	 * @param {string} key´
	 * @param {GuildConfigType} [_] Not needed, just here for typescript
	 * @param {any} [__] Not needed, just here for typescript
	 * @returns {Promise<void>}
	 * @protected
	 */
	protected async reset(message: Message, res: ResourceLoader, key: string, _?: GuildConfigType, __?: any): Promise<void>
	{
		const prompt: Message = await message.channel.send(res('CMD_CONFIG_RESET_PROMPT')) as Message;
		const response: Message = await message.channel.awaitMessages(
			(m: Message) => m.author.id === message.author.id,
			{
				maxMatches: 1,
				time: 3e4,
			},
		).then((collected: Collection<Snowflake, Message>) => collected.first());

		prompt.delete().catch(() => undefined);
		if (response && response.deletable) response.delete().then(() => undefined);

		if (!response || !Util.resolveBoolean(response.content.split(' ')[0]))
		{
			return message.channel.send(res('CMD_CONFIG_RESET_ABORT'))
				.then(() => undefined);
		}

		await message.guild.storage.remove(key);

		return message.channel.send(res('CMD_CONFIG_RESET_SUCCESS', { key: key.toLowerCase() }))
			.then(() => undefined);
	}
}

export { Command as ConfigCommand };
