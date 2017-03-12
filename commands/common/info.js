const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { version } = require('../../package.json');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');

module.exports = class InfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'info',
			aliases: ['status'],
			group: 'common',
			memberName: 'info',
			description: 'General informations about the bot.',
		});
	}

	async run(msg) {
		return msg.embed(new Embed()
			.setColor(0xffa500).setTitle('Infos über den Bot.')
			.setDescription('\u200b')
			.addField('❯ Online for:', `• ${moment.duration(this.client.uptime).format(' D hh:mm:ss')}`, true)
			.addField('❯ Used memory:', `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField('❯ Commands:', `• ${this.client.registry.commands.size}`, true)
			.addField('❯ spacebot-version:', `• v${version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`, true)
			.addField('❯ Shitcode repositorie:', '• [GitHub](https://github.com/SpaceEEC/glowing-potato)', true)
			.addField('\u200b', '\u200b')
			.setTimestamp()
			.setThumbnail(this.client.user.avatarURL)
			.setFooter(msg.content, msg.author.displayAvatarURL));
	}

};
