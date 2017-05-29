import { RichEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
import 'moment-duration-format';

export default class InfoCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['status'],
			description: 'General information about the bot.',
			group: 'info',
			memberName: 'info',
			name: 'info',
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed(new RichEmbed()
			.setColor(0xffa500).setTitle('General information about the bot.')
			.setDescription('\u200b')
			.addField('❯ Uptime:', `• ${(moment.duration(this.client.uptime) as any)
				.format('d[ days], h[ hours], m[ minutes and ]s[ seconds]')}`)
			.addField('❯ Memory in use:', `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField('❯ Commands:', `• ${this.client.registry.commands.size}`, true)
			// .addField('❯ spacebot-version:', `• v${version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`, true)
			.addField('❯ Shitcode repositorie:', '• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
			.addField('❯ Responsible:', '• `space#0302`', true)
			.addField('❯ Library:', '• [discord.js](https://github.com/hydrabolt/discord.js)', true)
			.addField('❯ Framework:', '• [discord.js-commando](https://github.com/Gawdl3y/discord.js-commando)', true)
			.setTimestamp()
			.setThumbnail(this.client.user.displayAvatarURL)
			.setFooter(msg.cleanContent, msg.author.displayAvatarURL));
	}
}
