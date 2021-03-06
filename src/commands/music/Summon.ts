import { Permissions } from 'discord.js';
import { CommandDecorators, Message } from 'yamdbf';

import { LogCommandRun } from '../../decorators/LogCommandRun';
import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { BetterResourceProxy } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Queue } from '../../structures/Queue';
import { RavenUtil } from '../../util/RavenUtil';

const { desc, group, guildOnly, name, usage, using, localizable } = CommandDecorators;

@desc('Summons the bot to your voice channel.')
@name('summon')
@group('music')
@guildOnly
@usage('<prefix>summon')
export default class SummonCommand extends Command<Client>
{
	@using(musicRestricted())
	@localizable
	@LogCommandRun
	@ReportError
	public async action(message: Message, [res]: [BetterResourceProxy]): Promise<CommandResult>
	{
		if (!message.member.voiceChannel)
		{
			return message.channel.send(res.MUSIC_NOT_IN_VOICECHANNEL())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		const permissions: Permissions = message.member.voiceChannel.permissionsFor(message.guild.me);
		if (!permissions.has('CONNECT'))
		{
			return message.channel.send(res.MUSIC_NO_CONNECT())
				.then((mes: Message) => void mes.delete(1e4))
				.catch(() => undefined);
		}
		if (!permissions.has('SPEAK'))
		{
			return message.channel.send(res.MUSIC_NO_SPEAK())
				.then((mes: Message) => void mes.delete(1e4))
				.catch(() => undefined);
		}

		const queue: Queue = this.client.musicPlayer.get(message.guild.id);

		if (!queue)
		{
			return message.channel
				.send(res.MUSIC_QUEUE_NON_EXISTENT())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}

		const joinMessage: Message = await message.channel.send(res.CMD_SUMMON_JOINING()) as Message;
		try
		{
			await message.member.voiceChannel.join();
			return joinMessage.edit(res.CMD_SUMMON_JOINED())
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}
		catch (error)
		{
			RavenUtil.error('MusicPlayer | Summon', error);
			return joinMessage.edit(res.MUSIC_JOIN_FAILED({ message: error.message }))
				.then((m: Message) => m.delete(1e4))
				.catch(() => null);
		}
	}
}
