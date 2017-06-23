import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { warn } from 'winston';

import { Queue } from '../../structures/Queue';

export default class StopMusicCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['gtfo', 'stfu', 'sile'],
			description: 'Stops playback.',
			details: 'Stops the song, deletes the playlist and disconnects the bot.',
			group: 'music',
			guildOnly: true,
			memberName: 'stop',
			name: 'stop',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;

		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', [])
			.concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);

		return msg.member.roles.some((r: Role) => roles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);

		// Temporary(TM) workaround for strange music problem
		if (args === 'force') {
			await queue.emptyQueue(true, this.queue);
			warn(`Force Stop: ${msg.author.tag} deleted the queue in ${msg.guild.name} (${msg.guild.id})`);
			return msg.say('Forced the deletion of the queue, this might have unexpected side effects.');
		}

		if (!queue || !queue.currentSong) {
			return msg.say('What do you expect to stop? 👀')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}
		if (!queue.playing) {
			return msg.say('Can not stop before the song started.')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}
		if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.vcName}, you are not here, so I will continue playing.`)
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}

		queue.stop();

		return msg.say('Party is over! 🚪 👈')
			.then((mes: Message) => void mes.delete(5000))
			.catch(() => undefined);
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
