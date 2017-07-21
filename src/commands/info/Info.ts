import { RichEmbed, version as libVersion } from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';
import { CommandDecorators, Message, ResourceLoader, version as YAMDBFVersion } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, localizable } = CommandDecorators;

const { version }: { version: string } = require('../../../package.json');

@aliases('stats')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays generic information about the bot')
@name('info')
@group('info')
@guildOnly
@usage('<prefix>info')
export default class InfoCommand extends Command<Client>
{
	@localizable
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<void>
	{
		const owners: string = this.client.owner.map((owner: string) => `\`${this.client.users.get(owner).tag}\``).join(', ');

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setTitle('General information about the bot')
			.addField('❯ Uptime:',
			`• ${(moment.duration(this.client.uptime) as any).format('d[ days], h[ hours], m[ minutes and ]s[ seconds]')}`,
			false)
			.addField('❯ Memory in use:',
			`• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField('❯ spacebot-version:',
			`• v${version}\n`
			+ '  ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))', true)
			.addField('❯ Repositorie:',
			'• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
			.addField('❯ Responsible:',
			`• ${owners}`, true);

		if (this.client.voiceConnections.size)
		{
			embed.addField('❯ Active voice connections:', this.client.voiceConnections.size, false);
		}

		embed.addField('❯ Library: ',
			'• [discord.js](https://github.com/hydrabolt/discord.js)\n'
			+ `  Version: ${libVersion}`, true)
			.addField('❯ Framework: ',
			'• [YAMDBF](https://github.com/zajrik/yamdbf)\n'
			+ `  Version: ${YAMDBFVersion}`, true)
			.setTimestamp()
			.setThumbnail(this.client.user.displayAvatarURL)
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return message.channel.send({ embed })
			.then(() => undefined);
	}
}
