import { FileOptions, RichEmbed, User } from 'discord.js';
import { Message } from 'yamdbf/bin';
import { clientPermissions, desc, group, guildOnly, name, usage, using } from 'yamdbf/bin/command/CommandDecorators';
import { expect } from 'yamdbf/bin/command/middleware/Expect';
import { resolve } from 'yamdbf/bin/command/middleware/Resolve';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES')
@desc('Gets an user\'s avatar')
@name('avatar')
@group('misc')
@guildOnly
@usage('<prefix>avatar <User>')
export default class AvatarCommand extends Command<Client>
{
	@using(resolve({ '<User>': 'User' }))
	@using(expect({ '<User>': 'User' }))
	@ReportError
	public async action(message: Message, [user]: [User]): Promise<void>
	{
		const filename: string = (user.avatar && user.avatar.startsWith('a_'))
			? 'user.gif'
			: 'user.png';

		const fileOptions: FileOptions = {
			attachment: user.displayAvatarURL,
			name: filename,
		};

		return message.channel.send(
			{
				embed: new RichEmbed()
					.setColor(message.member.displayColor)
					.attachFile(fileOptions)
					.setImage(`attachment://${filename}`),
			},
		).then(() => undefined);
	}
}
