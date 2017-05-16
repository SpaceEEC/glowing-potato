import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class SkipMusicCommand extends Command {
	private _queue: Map<string, Queue>;

	public constructor(client: CommandoClient) {
		super(client, {
			name: 'skip',
			aliases: ['next'],
			group: 'music',
			memberName: 'skip',
			description: 'Skips the current song.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 30
			}
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
			return msg.say('The queue is empty. 👀')
				.then((mes: Message) => mes.delete(5000));
		}
		if (!queue.vcMembers.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.vcName}, you are not here, so no skipping for you.`)
				.then((mes: Message) => mes.delete(5000));
		}

		const { currentSong } = queue;
		queue.skip();

		return msg.say(`What a lame decision, you forced me to skipped this wonderful song here: \`${currentSong.name}\`!`)
			.then((mes: Message) => mes.delete(5000));
	}

	private get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
}
