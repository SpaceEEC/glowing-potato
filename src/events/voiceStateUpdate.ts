import { GuildMember, RichEmbed, TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
import { GuildConfig } from '../dataProviders/models/GuildConfig';

export async function VoiceStateUpdate(client: CommandoClient): Promise<void> {
	client.on('voiceStateUpdate', async (oldMember: GuildMember, newMember: GuildMember) => {
		if (newMember.user.bot) return;

		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID: newMember.guild.id } }) as any)['0'].dataValues;

		if (!config.vlogChannel) return;

		const vlogChannel: TextChannel = client.channels.get(config.vlogChannel) as TextChannel;

		if ((!vlogChannel) && vlogChannel.type !== 'text') {
			config.vlogChannel = null;
			await GuildConfig.upsert(config);
			return;
		}

		if (!vlogChannel.permissionsFor(newMember.guild.member(client.user))
			.hasPermissions(['SEND_MESSAGES', 'EMBED_LINKS'])) return;

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
			vlogChannel.sendEmbed(new RichEmbed().setColor(clr).setDescription(desc)
				.setAuthor(newMember.displayName, newMember.user.displayAvatarURL, newMember.user.displayAvatarURL));
		}
	});
};
