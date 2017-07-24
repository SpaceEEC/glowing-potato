import { Role } from 'discord.js';
import { Lang, Message, MiddlewareFunction, ResourceLoader } from 'yamdbf';

import { Client } from '../structures/Client';
import { Command } from '../structures/Command';
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
	return async function(this: Command<Client>, message: Message, args: string[]): Promise<[Message, any[]]>
	{
		const [lang, musicRole, musicChannel]: string[] = await Promise.all<string>([
			message.guild.storage.settings.get('lang'),
			message.guild.storage.get(GuildConfigRoles.MUSICROLE),
			message.guild.storage.get(GuildConfigChannels.MUSICCHANNEL),
		]);

		const res: ResourceLoader = Lang.createResourceLoader(lang || this.client.defaultLang);

		if (musicRole)
		{
			const role: Role = message.guild.roles.get(musicRole);
			if (!role)
			{
				await message.guild.storage.remove(GuildConfigRoles.MUSICROLE);
			}
			else if (!message.member.roles.has(musicRole))
			{
				throw new Error(res('DECORATORS_MUSIC_ROLE_MEMBERS', { role: `\`@${role.name}\`` }));
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
				throw new Error(res('DECORATORS_MUSIC_TEXT_CHANNEL', { channel: `<#${musicChannel}>` }));
			}
		}

		if (voiceChannel)
		{
			const queue: Queue = this.client.musicPlayer.get(message.guild.id);
			if (queue && queue.voiceChannel !== message.member.voiceChannel)
			{
				throw new Error(res('DECORATORS_MUSIC_VOICE_CHANNEL', { channel: queue.voiceChannel.toString() }));
			}
		}

		return [message, args];
	};
}
