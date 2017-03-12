const { join } = require('path');
const { RichEmbed: Embed } = require('discord.js');
const GuildConfig = require(join(__dirname, '..', 'dataProviders', 'models', 'GuildConfig'));
const moment = require('moment');
moment.locale('de');

exports.run = async (client, oldMember, newMember) => {
	if (newMember.user.bot) return;

	const config = (await GuildConfig.findOrCreate({ where: { guildID: newMember.guild.id } }))['0'].dataValues;

	if (!config.vlogChannel) return;

	newMember = await newMember.guild.fetchMember(newMember);

	const vlogChannel = client.channels.get(config.vlogChannel);
	if (!vlogChannel) {
		config.vlogChannel = null;
		await GuildConfig.update(config, { where: { guildID: newMember.guild.id } });
		return;
	}

	if (!vlogChannel.permissionsFor(newMember.guild.member(client.user))
		.hasPermissions(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

	if (oldMember.voiceChannel !== newMember.voiceChannel) {
		let clr;
		let desc;
		// leave
		if (newMember.voiceChannel === undefined) {
			clr = 0xFF4500;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} disconnected from ${oldMember.voiceChannel.name}.`;
		} else if (oldMember.voiceChannel === undefined) {
			// join
			clr = 0x7CFC00;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} connected to ${newMember.voiceChannel.name}.`;
		} else {
			// move
			clr = 3447003;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} went from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}.`;
		}
		vlogChannel.sendEmbed(new Embed().setColor(clr).setDescription(desc)
			.setAuthor(newMember.displayName, newMember.user.displayAvatarURL, newMember.user.displayAvatarURL));
	}
};
