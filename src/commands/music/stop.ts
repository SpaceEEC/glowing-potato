import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class StopMusicCommand extends Command {
	private _queue: Map<string, Queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'stop',
			aliases: ['gtfo', 'stfu', 'sile'],
			group: 'music',
			memberName: 'stop',
			description: 'Stops playback.',
			details: 'Stops the song, deletes the playlist and disconnects the bot.',
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
			return msg.say('What do you expect to stop? 👀')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.playing) {
			return msg.say('Can not stop before the song started.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.vcName}, you are not here, so I will continue playing.`)
				.then((mes: Message) => mes.delete(5000));
		}

		queue.stop();

		return msg.say('Party is over! 🚪 👈')
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
