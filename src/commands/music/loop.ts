import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';

export default class ShuffleQueueCommand extends Command {
	private _queue: Map<string, Queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'loop',
			group: 'music',
			memberName: 'loop',
			description: 'Toggles queue.',
			details: 'Songs will be appended to the queue after they finished, rather than just being deleted.',
			examples: [
				'`loop enable` Will enable looping.',
				'`loop disable` Will disable looping.',
				'No shit, sherlock.',
				'`loop` Will display whether looping is enabled or not.',
			],
			guildOnly: true,
			args: [
				{
					key: 'state',
					prompt: 'do you like to enable or disable the loop?\n',
					type: 'boolean',
					default: ''
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { state: string | boolean }): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);

		if (!this.queue.has(msg.guild.id)) {
			return msg.say('Trying to enable the loop while nothing is being played?')
				.then((mes: Message) => mes.delete(5000));
		}

		if (args.state === '') {
			return msg.say(`The loop is at the moment ${queue.loop ? 'enabled' : 'disabled'}.`)
				.then((mes: Message) => mes.delete(5000));
		}

		if (args.state) {
			if (queue.loop) {
				return msg.say('The loop is already enabled, my friend.')
					.then((mes: Message) => mes.delete(5000));
			}

			queue.loop = true;
			return msg.say('The loop is now enabled!')
				.then((mes: Message) => mes.delete(5000));
		} else {
			if (!queue.loop) {
				return msg.say('The loop is already disabled, my friend.')
					.then((mes: Message) => mes.delete(5000));
			}

			queue.loop = false;
			return msg.say('The loop is now disabled!')
				.then((mes: Message) => mes.delete(5000));
		}
	}

	get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
