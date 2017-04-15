import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue, song } from './play';

export default class ResumeMusicCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'resume',
			aliases: ['continue'],
			group: 'music',
			memberName: 'resume',
			description: 'Resumes the song.',
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
			return msg.say('Sorry to disappoint you, but you can\'t resume an empty queue.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say(`I am over here in ${queue.voiceChannel.name}, either you come to me, or you summon me to you.`)
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.songs[0].dispatcher) {
			return msg.say('That song has no started yet, it will do that automatically whenever it\'s ready.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (queue.songs[0].playing) {
			return msg.say('Trying to resume a currently playing song? You are not the smartest one.')
				.then((mes: Message) => mes.delete(5000));
		}

		queue.songs[0].dispatcher.resume();
		queue.songs[0].playing = true;

		return msg.say('Revived the party!')
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play')as any).queue;

		return this._queue;
	}
};
