import { GuildMember, TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import GuildConfig from '../dataProviders/models/GuildConfig';

export async function GuildMemberRemove(client: CommandoClient): Promise<void> {
	client.on('guildMemberRemove', async (member: GuildMember) => {
		if (member.id === client.user.id) return;

		const conf: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID: member.guild.id } }) as any)['0'].dataValues;

		if (!conf.leaveMessage) return;

		const response: string = conf.leaveMessage
			.split(':member:').join(`\`@${member.user.username}#${member.user.discriminator}\``)
			.split(':guild:').join(member.guild.name);
		const clientMember: GuildMember = await member.guild.fetchMember(client.user);

		if (conf.logChannel) {
			if ((!client.channels.has(conf.logChannel)) && client.channels.get(conf.logChannel).type !== 'text') {
				conf.logChannel = null;
				GuildConfig.upsert(conf);
				return;
			}

			if (!(client.channels.get(conf.logChannel) as TextChannel)
				.permissionsFor(clientMember)
				.hasPermission('SEND_MESSAGES')) return;

			(member.guild.channels.get(conf.logChannel) as TextChannel).send(response).catch((e: Error) => {
				client.emit('error', `Error while writing in the logChannel (${conf.logChannel}) of (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
			});
		}

		if (conf.anChannel) {
			if ((!client.channels.has(conf.anChannel)) && client.channels.get(conf.anChannel).type !== 'text') {
				conf.anChannel = null;
				GuildConfig.upsert(conf);
				return;
			}

			if (!(client.channels.get(conf.anChannel) as TextChannel)
				.permissionsFor(clientMember)
				.hasPermission('SEND_MESSAGES')) return;

			(member.guild.channels.get(conf.anChannel) as TextChannel).send(response).catch((e: Error) => {
				client.emit('error', `Error while writing in the anChannel (${conf.logChannel}) of (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
			});
		}
	});
};
