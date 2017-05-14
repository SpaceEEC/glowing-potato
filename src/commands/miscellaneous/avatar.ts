import { Message, User } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class AvatarCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'avatarbyid',
			aliases: ['avatar'],
			group: 'miscellaneous',
			guildOnly: true,
			memberName: 'avatar',
			description: 'Displays the avatar from the specified user by their id.',
			args: [
				{
					key: 'id',
					prompt: 'note that this command only accepts IDs.\nWhose avatar would you like to see?\n',
					type: 'string',
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { id: string }): Promise<Message | Message[]> {
		const user: User = this.client.users.get(args.id) || await this.client.fetchUser(args.id).catch(() => null);
		if (!user) return msg.say('No user found by that ID.');
		return msg.channel.send({ files: [{ attachment: user.displayAvatarURL, name: user.avatar && user.avatar.startsWith('a_') ? 'avatar.gif' : 'avatar.png' }] });
	}
}
