import { Message, Permissions, Role, VoiceChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';
import { logger } from './play';

export default class SummonCommand extends Command {
	private _queue: Map<string, Queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'summon',
			aliases: ['overhere'],
			group: 'music',
			memberName: 'summon',
			description: 'Summons the bot.',
			details: 'Summons the bot to the current channel.',
			guildOnly: true,
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);

		if (!queue) {
			return msg.say('I am not playing, queue something up and I\'ll come automatically to you.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!msg.member.voiceChannel) {
			return msg.say('Please explain me, how am I supposed to join you? You are not even in a voice channel!')
				.then((mes: Message) => mes.delete(5000));
		}
		if (queue.vcMembers.has(msg.author.id)) {
			return msg.say('Trying to summon me, when we are already in the same channel, bravo.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.currentSong.dispatcher) {
			return msg.say('I can only join you after the song started. Please wait a moment.')
				.then((mes: Message) => mes.delete(5000));
		}

		const voiceChannel: VoiceChannel = msg.member.voiceChannel;

		const permissions: Permissions = voiceChannel.permissionsFor(this.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!permissions.has('SPEAK')) {
			return msg.say('Your party looks nice, I\'d love to join, but I am unfortunately not allowed to speak there, so I don\'t bother joining.')
				.then((mes: Message) => mes.delete(5000));
		}

		const joinMessage: Message = await msg.say('Joining your channel...') as Message;
		try {
			await queue.join(voiceChannel);
			return joinMessage.edit('Joined your channel, party will now continue here!')
				.then((mes: Message) => mes.delete(5000)).catch(() => null);
		} catch (err) {
			logger.log('summon', `[${msg.guild.id}]`, err);
			joinMessage.delete().catch(() => null);
			return msg.say('An error occurred while joining your channel, such a shame.')
				.then((mes: Message) => mes.delete(5000)).catch(() => null);
		}
	}

	get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
