import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { GuildConfig } from '../../dataProviders/models/GuildConfig';

export default class LogChannelCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['loggingchannel'],
			args: [
				{
					default: 'show',
					key: 'channel',
					prompt: 'wich channel do you like to set up or remove?\n',
					type: 'channel',
				},
			],
			description: 'Toggles this type of channel.',
			details: stripIndents`
				Enables or disables the logging of new or left member, when a message is set up.
				To remove a channel, specify just specify that channel.
				Mention the same channel again to remove it.
				Omit the channel parameter to show the current channel.`,
			examples: ['`logchannel #logs`'],
			group: 'administration',
			guildOnly: true,
			memberName: 'logchannel',
			name: 'logchannel',
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
			const logChannel: TextChannel = msg.guild.channels.get(config.logChannel) as TextChannel;
			return msg.say(logChannel
				? `The log channel is ${logChannel}.`
				: `No log channel set.`,
			);
		}

		config.logChannel = args.channel.id === config.logChannel ? null : args.channel.id;

		let response: string = '';
		if (config.logChannel &&
			!args.channel.permissionsFor(msg.guild.member(this.client.user)
				|| await msg.guild.fetchMember(this.client.user)).has('SEND_MESSAGES')) {
			response = '**Note:** I don\'t have permissions to send messages to that channel.\n';
		}

		response += 'The log channel '
			+ config.logChannel
			? `is now ${msg.guild.channels.get(config.logChannel)!}`
			: 'has been disabled';

		await config.save();

		return msg.say(response);
	}
}
