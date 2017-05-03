import { GuildMember, RichEmbed, TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
import GuildConfig from '../dataProviders/models/GuildConfig';

export default async function voiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
	const { client } = newMember;
	if (newMember.user.bot) return;

	const config: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID: newMember.guild.id } });

	if (!config.vlogChannel) return;

	const vlogChannel: TextChannel = client.channels.get(config.vlogChannel) as TextChannel;

	if ((!vlogChannel) && vlogChannel.type !== 'text') {
		await config.setAndSave('vlogChannel', null);
		return;
	}

	if (!vlogChannel.permissionsFor(newMember.guild.member(client.user))
		.has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

	if (oldMember.voiceChannel !== newMember.voiceChannel) {
		let clr: number;
		let desc: string;
		// leave
		if (!newMember.voiceChannel) {
			clr = 0xFF4500;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} disconnected from ${oldMember.voiceChannel.name}.`;
		} else if (!oldMember.voiceChannel) {
			// join
			clr = 0x7CFC00;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} connected to ${newMember.voiceChannel.name}.`;
		} else {
			// move
			clr = 3447003;
			desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} went from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}.`;
		}
		vlogChannel.send({
			embed: new RichEmbed().setColor(clr).setDescription(desc)
				.setAuthor(newMember.displayName, newMember.user.displayAvatarURL, newMember.user.displayAvatarURL)
		});
	}
};
