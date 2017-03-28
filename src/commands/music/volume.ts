import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue, song } from './play';

export default class VolumeCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'volume',
			group: 'music',
			memberName: 'volume',
			description: 'Sets the volume.',
			details: 'Valid volume levels are 1 to 10.',
			examples: [
				'`volume` Will display the current volume',
				'`volume 2` Will set the volume to 2.',
			],
			args: [
				{
					key: 'volume',
					prompt: 'to which level would you like set the volume?\n',
					validate: (value: string) => {
						const int: number = Number.parseInt(value);
						if (!Number.isNaN(int)
							&& (int >= 1)
							&& (int <= 10)) return true;
						return 'Please specify a volume between 1 and 10.';
					},
					parse: (value: string) => value,
					default: ''
				}
			],
			guildOnly: true,
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const djRoles: string[] = this.client.provider.get(msg.guild.id, 'djRoles', []);
		if (!djRoles.length) return true;
		const roles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []), djRoles);
		return msg.member.roles.some((r: Role) => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { volume: string }): Promise<Message | Message[]> {
		const volume: number = parseInt(args.volume);
		const queue: queue = this.queue.get(msg.guild.id);

		if (!queue) {
			return msg.say('The queue is empty, no need to change the volume.')
				.then((mes: Message) => mes.delete(5000));
		}
		if (isNaN(volume)) {
			return msg.say(`The volume is \`${queue.volume}\`.`)
				.then((mes: Message) => mes.delete(30000));
		}
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so the current volume will stay.`)
				.then((mes: Message) => mes.delete(5000));
		}

		queue.volume = volume;
		this.client.provider.set(msg.guild, 'volume', volume);
		if (queue.songs[0].dispatcher) queue.songs[0].dispatcher.setVolumeLogarithmic(volume / 5);
		return msg.say(`Volume is now \`${volume}\`.`)
			.then((mes: Message) => mes.delete(5000));
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as any).queue;

		return this._queue;
	}
};
