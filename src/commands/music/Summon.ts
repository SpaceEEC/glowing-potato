import { Permissions } from 'discord.js';
import { Message } from 'yamdbf/bin';
import { desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';

import { musicRestricted } from '../../decorators/MusicRestricted';
import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@desc('Summons the bot to your voice channel.')
@name('summon')
@group('music')
@guildOnly
@usage('<prefix>summon')
export default class StopCommand extends Command<Client>
{
	@using(musicRestricted())
	@ReportError
	public async action(message: Message): Promise<void>
	{
		if (!message.member.voiceChannel)
		{
			return message.channel.send('Small reminder: You have to be in a voice channel.')
				.then((m: Message) => m.delete(5e3))
				.catch(() => null);
		}

		const permissions: Permissions = message.member.voiceChannel.permissionsFor(message.guild.me);
		if (!permissions.has('CONNECT'))
		{
			return message.channel.send([
				'Your voice channel sure looks nice, but I am unfortunately not allowed to join it.',
				'Better luck next time, buddy.',
			])
				.then((mes: Message) => void mes.delete(5e3))
				.catch(() => undefined);
		}
		if (!permissions.has('SPEAK'))
		{
			return message.channel.send([
				'Your party sure looks nice.',
				'I\'d love to join, but I am unfortunately not allowed to speak there.',
			])
				.then((mes: Message) => void mes.delete(5e3))
				.catch(() => undefined);
		}

		return this.client.musicPlayer.summon(message);
	}
}
