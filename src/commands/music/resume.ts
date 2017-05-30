import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class ResumeMusicCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['continue'],
			description: 'Resumes the song.',
			group: 'music',
			guildOnly: true,
			memberName: 'resume',
			name: 'resume',
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
			return msg.say('Sorry to disappoint you, but you can\'t resume an empty queue.')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}
		if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say(`I am over here in ${queue.vcName}, either you come to me, or you summon me to you.`)
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}
		if (!queue.currentSong.dispatcher) {
			return msg.say('That song has no started yet, it will do that automatically whenever it\'s ready.')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}
		if (queue.playing) {
			return msg.say('Trying to resume a currently playing song? You are not the smartest one.')
				.then((mes: Message) => void mes.delete(5000))
				.catch(() => undefined);
		}

		queue.playing = true;

		return msg.say('Revived the party!')
			.then((mes: Message) => void mes.delete(5000))
			.catch(() => undefined);
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
