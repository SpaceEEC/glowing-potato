import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import Song from '../../structures/Song';
import { queue, song } from './play';

export default class RemoveMusicCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'remove',
			aliases: ['splice'],
			group: 'music',
			memberName: 'remove',
			description: 'Removes a Song from the queue.',
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
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { index: number }): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) {
			return msg.say('There is no queue, why not add some songs yourself?')
				.then((mes: Message) => mes.delete(5000));
		}
		const song: song = queue.songs[args.index];
		if (!song) {
			return msg.say('This entry wasn\'t found!')
				.then((mes: Message) => mes.delete(5000));
		}

		const requestMessage: Message = await msg.say(`Are you sure you want to skip this wonderful song?\n${song.name}\n\n__y__es/__n__o`) as Message;
		const response: Message = (await requestMessage.channel.awaitMessages((m: Message) => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
		requestMessage.delete().catch(() => null);
		if (!response || (response && !['yes', 'y'].includes(response.content))) {
			return msg.say('Aborting then.')
				.then((mes: Message) => mes.delete(5000));
		}

		queue.songs.splice(queue.songs.indexOf(song), 1);
		return msg.say(`What a shame, you forced me to remove this wonderful song from the queue:\`${song.name}\``)
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play')as any).queue;

		return this._queue;
	}
};
