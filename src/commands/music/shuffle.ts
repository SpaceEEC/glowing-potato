import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class ShuffleQueueCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			description: 'Shuffles the playlist.',
			group: 'music',
			guildOnly: true,
			memberName: 'shuffle',
			name: 'shuffle',
			throttling: {
				duration: 60,
				usages: 1,
			},
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

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);

		if (!queue || !queue.currentSong) {
			return msg.say('There is nothing to shuffle in this guild. Change that!')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}

		queue.shuffle();

		return msg.say('The queue has been shuffled.')
			.then((mes: Message) => void mes.delete(5000))
			.catch(() => undefined);
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
