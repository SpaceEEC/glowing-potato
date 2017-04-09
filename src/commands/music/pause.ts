import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue } from './play';

export default class PauseMusicCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
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
		const queue: queue = this.queue.get(msg.guild.id);

		if (!queue) {
			return msg.say('Trying to pause without anything playing is certainly a smart move.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so why are you even trying to pause?`)
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.songs[0].dispatcher) {
			return msg.say('Pausing is only possible after the song started.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.songs[0].playing) {
			return msg.say('That song is already paused, you genius.')
				.then((mes: Message) => mes.delete(5000));
		}

		queue.songs[0].dispatcher.pause();
		queue.songs[0].playing = false;

		return msg.say('Paused the song, be sure to finish it!')
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play')as any).queue;

		return this._queue;
	}
};
