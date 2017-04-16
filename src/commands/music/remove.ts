import { Message, Role } from 'discord.js';
import { ArgumentInfo, Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import Queue from '../../structures/Queue';
import Song from '../../structures/Song';
import Util from '../../util/util';

export default class RemoveMusicCommand extends Command {
	private _queue: Map<string, Queue>;
	private _util: Util;
	constructor(client: CommandoClient) {
		super(client, {
			name: 'remove',
			aliases: ['splice'],
			group: 'music',
			memberName: 'remove',
			description: 'Removes a Song\nfrom the queue.',
			examples: [
				'`remove` Removes the first song in the queue.',
				'`remove 1` Also removes the first song in the queue.',
				'`remove 2` Removes the second song in the queue.',
				'And so on.'
			],
			guildOnly: true,
			args: [
				{
					key: 'index',
					prompt: 'which song do you like to remove?\n',
					type: 'integer',
					min: 1,
				}
			]
		});
		this._util = new Util(client);
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { index: number }): Promise<Message | Message[]> {
		const queue: Queue = this.queue.get(msg.guild.id);
		if (!queue) {
			return msg.say('There is no queue, what do you hope to remove?')
				.then((mes: Message) => mes.delete(5000));
		}
		const song: Song = queue.Song(args.index);
		if (!song) {
			return msg.say('This entry wasn\'t found!')
				.then((mes: Message) => mes.delete(5000));
		}

		const argument: ArgumentInfo = {
			key: 'choice',
			prompt: `Are you sure you want to remove this wonderful song from the queue?\n\`${song.name}\´\n\n__y__es/__n__o`,
			type: 'boolean'
		};
		const choice: boolean = await this._util.prompt<boolean>(msg, argument).catch(() => null);

		if (!choice) {
			return msg.say('Aborting then.')
				.then((mes: Message) => mes.delete(5000));
		}

		queue.skip(args.index);
		return msg.say(`What a shame, you forced me to remove this wonderful song from the queue:\`${song.name}\``)
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, Queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
