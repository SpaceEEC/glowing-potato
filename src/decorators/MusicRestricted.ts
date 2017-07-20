import { Role } from 'discord.js';
import { Message, MiddlewareFunction } from 'yamdbf';

import { Queue } from '../structures/Queue';
import { GuildConfigChannels, GuildConfigRoles } from '../types/GuildConfigKeys';

/**
 * Restricts a command to the music channel and to music role, optionally also to the current voice channel of the bot.
 * @param {boolean} [voiceChannel=false] Whether to also restrict to the current voice channel of the bot
 * @returns {MiddlewareFunction}
 */
export function musicRestricted(voiceChannel: boolean = false): MiddlewareFunction
{
	// tslint:disable-next-line:only-arrow-functions
	return async function(message: Message, args: string[]): Promise<[Message, any[]]>
	{
		const [musicRole, musicChannel]: string[] = await Promise.all([
			message.guild.storage.get(GuildConfigRoles.MUSICROLE),
			message.guild.storage.get(GuildConfigChannels.MUSICCHANNEL),
		]);

		if (musicRole)
		{
			const role: Role = message.guild.roles.get(musicRole);
			if (!role)
			{
				await message.guild.storage.remove(GuildConfigRoles.MUSICROLE);
			}
			else if (!message.member.roles.has(musicRole))
			{
				throw new Error(`This command is only usable by members with the music role: \`@${role.name}\`!`);
			}
		}

		if (musicChannel)
		{
			if (!message.guild.channels.has(musicChannel))
			{
				await message.guild.storage.remove(GuildConfigChannels.MUSICCHANNEL);
			}
			else if (message.channel.id !== musicChannel)
			{
				throw new Error(`This command is only usable in the music channel: <#${musicChannel}>!`);
			}
		}

		if (voiceChannel)
		{
			const queue: Queue = this.client.musicPlayer.get(message.guild.id);
			if (queue && queue.voiceChannel !== message.member.voiceChannel)
			{
				throw new Error(`This command is only usable by members that are in my voice channel: ${queue.voiceChannel}!`);
			}
		}

		return [message, args];
	};
}
