import { RichEmbed } from 'discord.js';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
import 'moment-duration-format';

const { version }: { version: string } = require('../../../package.json');

export default class InfoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'info',
			aliases: ['status'],
			group: 'info',
			memberName: 'info',
			description: 'General informations about the bot.'
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed(new RichEmbed()
			.setColor(0xffa500).setTitle('General informations about the bot.')
			.setDescription('\u200b')
			.addField('❯ Uptime:', `• ${moment.duration(this.client.uptime).format('d[ days], h[ hours], m[ minutes and ]s[ seconds]')}`)
			.addField('❯ Used memory:', `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField('❯ Commands:', `• ${this.client.registry.commands.size}`, true)
			//.addField('❯ spacebot-version:', `• v${version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`, true)
			.addField('❯ Shitcode repositorie:', '• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
			.addBlankField(true)
			.addField('❯ Library:', '[discord.js](https://github.com/hydrabolt/discord.js)', true)
			.addField('❯ Framework:', '[discord.js-commando](https://github.com/Gawdl3y/discord.js-commando)', true)
			.setTimestamp()
			.setThumbnail(this.client.user.displayAvatarURL)
			.setFooter(msg.cleanContent, msg.author.displayAvatarURL));
	}
};
