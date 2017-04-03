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
			group: 'common',
			memberName: 'info',
			description: 'General informations about the bot.'
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed(new RichEmbed()
			.setColor(0xffa500).setTitle('General informations about the bot.')
			.setDescription('\u200b')
			.addField('❯ Online for:', `• ${(moment.duration(this.client.uptime, 'milliseconds') as any).humanize()}`, true) //.format(' D[d] hh[h] mm[m] ss[s]')}`, true)
			.addField('❯ Used memory:', `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField('❯ Commands:', `• ${this.client.registry.commands.size}`, true)
			//.addField('❯ spacebot-version:', `• v${version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`, true)
			.addField('❯ Shitcode repositorie:', '• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
			.addField('\u200b', '\u200b')
			.setTimestamp()
			.setThumbnail(this.client.user.displayAvatarURL)
			.setFooter(msg.content, msg.author.displayAvatarURL));
	}
};
