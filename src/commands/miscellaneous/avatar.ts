import { Message, User } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class AvatarCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['avatar'],
			args: [
				{
					key: 'id',
					prompt: 'note that this command only accepts IDs.\nWhose avatar would you like to see?\n',
					type: 'string',
				},
			],
			description: 'Displays the avatar from the specified user by their id.',
			group: 'miscellaneous',
			guildOnly: true,
			memberName: 'avatar',
			name: 'avatarbyid',
		});
	}

	public async run(msg: CommandMessage, args: { id: string }): Promise<Message | Message[]> {
		const user: User = this.client.users.get(args.id) || await this.client.fetchUser(args.id).catch(() => null);
		if (!user) return msg.say('No user found by that ID.');

		return msg.say('',
			{
				files:
				[
					{
						attachment: user.displayAvatarURL,
						name: user.avatar && user.avatar.startsWith('a_')
							? 'avatar.gif'
							: 'avatar.png',
					},
				],
			},
		);
	}
}
