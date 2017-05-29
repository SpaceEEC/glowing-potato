import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class MusicChannelCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['djchannel', 'djchannels', 'mchannel', 'mchannels', 'musicchannels'],
			args: [
				{
					default: 'show',
					key: 'channel',
					prompt: 'which channel do you like to add or remove?\n',
					type: 'channel',
				},
			],
			description: 'Musicchannels configuration.',
			details: stripIndents`
				To add or remove a music channel, simply specify it, either with a mention, name or ID.
				If no channel is present, the commands are allowed everywhere.
				To remove a channel, specify an already linked one, it will be removed then.`,
			examples: [
				'`mchannel #music-commands` Adds or removes the `#music.commands` channel from the music channels',
				'`mchannel` Displays all music channels.',
			],
			group: 'administration',
			guildOnly: true,
			memberName: 'musicchannel',
			name: 'musicchannel',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	// tslint:disable-next-line:max-line-length
	public async run(msg: CommandMessage, args: { channel: TextChannel | string, added: boolean }): Promise<Message | Message[]> {
		const channels: string[] = this.client.provider.get(msg.guild.id, 'djChannels', []);

		if (!(args.channel instanceof TextChannel)) {
			return msg.say(channels.length
				? channels.map((c: string) => `<#${c}>`).join(', ')
				: 'No channel(s) set up, so everywhere.');
		}

		if (channels.includes(args.channel.id)) {
			channels.splice(channels.indexOf(args.channel.id), 1);
		} else {
			args.added = true;
			channels.push(args.channel.id);
		}

		this.client.provider.set(msg.guild.id, 'djChannels', channels);

		return msg.say(stripIndents`
			${args.channel} ${args.added ? `has been added to` : 'has been removed from'} the music channels!
    		${channels.length
				? `Current channels: ${channels.map((c: string) => `<#${c}> `).join(', ')}`
				: 'No channel set, so everywhere, allowed.'}`,
		);
	}
}
