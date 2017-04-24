import { GuildMember, TextChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import GuildConfig from '../dataProviders/models/GuildConfig';

export default async function guildMemberAdd(member: GuildMember): Promise<void> {
	const { client } = member;
	if (member.id === client.user.id) return;

	const conf: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID: member.guild.id } });

	if (!conf.joinMessage) return;

	const response: string = conf.joinMessage
		.split(':member:').join(`\`@${member.user.tag}\``)
		.split(':guild:').join(member.guild.name);
	const clientMember: GuildMember = await member.guild.fetchMember(client.user);

	if (conf.logChannel) {
		if ((!client.channels.has(conf.logChannel)) && client.channels.get(conf.logChannel).type !== 'text') {
			await conf.setAndSave('logChannel', null);
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
			await conf.setAndSave('anChannel', null);
			return;
		}

		if (!(client.channels.get(conf.anChannel) as TextChannel)
			.permissionsFor(clientMember)
			.hasPermission('SEND_MESSAGES')) return;

		(member.guild.channels.get(conf.anChannel) as TextChannel).send(response).catch((e: Error) => {
			client.emit('error', `Error while writing in the anChannel (${conf.logChannel}) of (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
		});
	}
};
