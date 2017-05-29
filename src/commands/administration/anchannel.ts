import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import GuildConfig from '../../dataProviders/models/GuildConfig';

export default class AnnouncementChannelCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['announcementchannel'],
			args: [
				{
					default: 'show',
					key: 'channel',
					prompt: 'wich channel do you like to set or remove?\n',
					type: 'channel',
				},
			],
			description: 'Toggles this type of channel.',
			details: stripIndents`
				Enables or disables the announcing of new or left member, when a message is set up.
				Sets or removes the channel for that purpose.
				Mention the same channel again to remove it.
      			Omit the channel parameter to show the current channel.`,
			examples: ['`anchannel #logs`'],
			group: 'administration',
			guildOnly: true,
			memberName: 'anchannel',
			name: 'anchannel',
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
			return msg.say(config.anChannel
				? `The announcement channel is ${msg.guild.channels.get(config.anChannel) || 'deleted, removing from config...'}.`
				: `No announcement channel set.`,
			);
		}

		config.anChannel = args.channel.id === config.anChannel ? null : args.channel.id;

		let response: string = '';
		if (config.anChannel
			&& !args.channel.permissionsFor(msg.guild.member(this.client.user)
				|| await msg.guild.fetchMember(this.client.user)).hasPermission('SEND_MESSAGES')
		) {
			response = '**Note:** I don\'t have permissions to send messages to that channel.\n';
		}

		response += 'The announcement channel '
			+ config.anChannel
			? `is now ${msg.guild.channels.get(config.anChannel)}!`
			: 'has been removed!';

		await config.save();

		return msg.say(response);
	}
}
