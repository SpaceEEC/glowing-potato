import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class ConfigCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'musicchannel',
			aliases: ['djchannel', 'djchannels', 'mchannel', 'mchannels', 'musicchannels'],
			group: 'adminstuff',
			memberName: 'musicchannel',
			description: 'Adds or removes a musicchannel.',
			details: stripIndents`
      To add or remove a music channel, simply specify it, either with a mention, name or ID.
      If no channel is present, the commands are allowed everywhere.
      To remove a channel, specify an already linked one, it will be removed then.`,
			examples: [
				'`mchannel #music-commands` Adds or removes the `#music.commands` channel from the music channels',
				'`mchannel` Displays all music channels.'
			],
			guildOnly: true,
			args: [
				{
					key: 'channel',
					prompt: 'which channel do you like to add or remove?\n',
					type: 'channel',
					default: 'show',
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { channel: TextChannel | String, added: boolean }): Promise<Message | Message[]> {
		const channels: string[] = this.client.provider.get(msg.guild.id, 'djChannel', []);

		if (args.channel === 'show') {
			msg.say(channels.length ? channels.map((c: string) => `<#${c}>`).join(', ') : 'No channel set, so everywhere.');
			return;
		}

		if (channels.includes((args.channel as TextChannel).id)) {
			channels.splice(channels.indexOf((args.channel as TextChannel).id), 1);
		} else {
			args.added = true;
			channels.push((args.channel as TextChannel).id);
		}

		this.client.provider.set(msg.guild.id, 'djChannel', channels);

		msg.say(stripIndents`${args.channel} ${args.added ? `has been added to` : 'has been removed from'} the music channels!
    ${channels.length ? `Current channels: ${channels.map((c: string) => `<#${c}> `).join(', ')}` : 'No channel set, so everywhere.'}`);
	}
};
