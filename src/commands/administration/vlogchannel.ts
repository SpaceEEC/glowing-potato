import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { GuildConfig } from '../../dataProviders/models/GuildConfig';

export default class VoicelogChannelCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['vlogchannel', 'voicelogchannel'],
			args: [
				{
					default: 'show',
					key: 'channel',
					prompt: 'wich channel do you like to set or remove?\n',
					type: 'channel',
				},
			],
			description: 'Toggles this type of channel.',
			details: stripIndents`Enables or disables logging of member movements in voice channels.
				Sets or removes the channel for that logging.
				Mention the same channel again to remove it.
				Omit the channel parameter to show the current channel.`,
			examples: ['`vlogchannel #logs`'],
			group: 'administration',
			guildOnly: true,
			memberName: 'vlogchannel',
			name: 'vlogchannel',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { channel: TextChannel | string }): Promise<Message | Message[]> {
		const config: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID: msg.guild.id } });

		if (!(args.channel instanceof TextChannel)) {
			const vlogChannel: TextChannel = msg.guild.channels.get(config.vlogChannel) as TextChannel;
			return msg.say(vlogChannel ? `The voicelog channel is: ${vlogChannel}.` : `No voicelog channel set.`);
		}

		config.vlogChannel = args.channel.id === config.vlogChannel ? null : args.channel.id;

		let response: string = '';
		if (config.vlogChannel &&
			!args.channel.permissionsFor(msg.guild.member(this.client.user)
				|| await msg.guild.fetchMember(this.client.user)).has('SEND_MESSAGES')
		) {
			response = '**Note:** I don\'t have permissions to send messages to that channel.\n';
		}
		response += 'The voicelog channel '
			+ config.vlogChannel
			? `is now: ${msg.guild.channels.get(config.vlogChannel)}!`
			: 'has been disabled!';

		await config.save();

		return msg.say(response);
	}
}
