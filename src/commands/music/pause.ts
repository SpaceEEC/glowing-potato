import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class PauseMusicCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			name: 'pause',
			group: 'music',
			memberName: 'pause',
			description: 'Pauses playback.',
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
			return msg.say('Trying to pause without anything playing is certainly a smart move.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say(`I am currently playing in ${queue.vcName}. You better don't mess with their music bot!`)
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.currentSong.dispatcher) {
			return msg.say('Pausing is only possible after the song started.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.playing) {
			return msg.say('That song is already paused, you genius.')
				.then((mes: Message) => mes.delete(5000));
		}

		queue.playing = false;

		return msg.say('Paused the song, be sure to finish it!')
			.then((mes: Message) => mes.delete(5000));
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
