import { DiscordAPIError, GuildChannel, GuildMember, TextChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf/bin';

import { GuildConfigChannels, GuildConfigStrings } from '../types/GuildConfigKeys';
import { Client } from './Client';
import { RichEmbed } from './RichEmbed';

const { on, registerListeners } = ListenerUtil;

export class EventHandlers
{
	private _client: Client;
	public constructor(client: Client)
	{
		this._client = client;
		registerListeners(this._client, this);
	}

	@on('guildMemberAdd')
	public async _onGuildMemberAdd(member: GuildMember): Promise<void>
	{
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(member.guild.id);

		const [
			joinMessage,
			logChannel,
			anChannel,
		]: string[] = await Promise.all([
			guildStorage.get(GuildConfigStrings.JOINMESSAGE),
			guildStorage.get(GuildConfigChannels.LOGCHANNEL),
			guildStorage.get(GuildConfigChannels.ANCHANNEL),
		]);

		if (!joinMessage) return;

		const guildMe: GuildMember = member.guild.me || await member.guild.fetchMember(this._client.user.id);
		const message: string = joinMessage
			.replace(/:member:/g, `\`@${member.user.tag}\``)
			.replace(/:guild:/g, member.guild.name);

		if (logChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(logChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.LOGCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Join:LogChannel', error.name, error.code.toString(), error.message);
					});
			}
		}

		if (anChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(anChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.ANCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Join:AnChannel', error.name, error.code.toString(), error.message);
					});
			}
		}
	}

	@on('guildMemberRemove')
	public async _onGuildMemberRemove(member: GuildMember): Promise<void>
	{
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(member.guild.id);

		const [
			leaveMessage,
			logChannel,
			anChannel,
		]: string[] = await Promise.all([
			guildStorage.get(GuildConfigStrings.LEAVEMESSAGE),
			guildStorage.get(GuildConfigChannels.LOGCHANNEL),
			guildStorage.get(GuildConfigChannels.ANCHANNEL),
		]);

		if (!leaveMessage) return;

		const guildMe: GuildMember = member.guild.me || await member.guild.fetchMember(this._client.user.id);
		const message: string = leaveMessage
			.replace(/:member:/g, `\`@${member.user.tag}\``)
			.replace(/:guild:/g, member.guild.name);

		if (logChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(logChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.LOGCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Leave:LogChannel', error.name, error.code.toString(), error.message);
					});
			}
		}

		if (anChannel)
		{
			const channel: GuildChannel = member.guild.channels.get(anChannel);
			if (!channel || !(channel instanceof TextChannel))
			{
				await guildStorage.remove(GuildConfigChannels.ANCHANNEL);
			}
			else if (channel.permissionsFor(guildMe).has('SEND_MESSAGES'))
			{
				channel.send(message)
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('Leave:AnChannel', error.name, error.code.toString(), error.message);
					});
			}
		}
	}

	@on('voiceStateUpdate')
	public async _onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void>
	{
		if (newMember.user.bot) return;
		const guildStorage: GuildStorage = await this._client.storage.guilds.get(newMember.guild.id);

		const vlogChannel: string = await guildStorage.get(GuildConfigChannels.VLOGCHANNEL);

		if (!vlogChannel) return;

		const guildMe: GuildMember = newMember.guild.me || await newMember.guild.fetchMember(this._client.user.id);
		const channel: GuildChannel = newMember.guild.channels.get(vlogChannel);

		if (!channel || !(channel instanceof TextChannel))
		{
			await guildStorage.remove(GuildConfigChannels.VLOGCHANNEL);
		}
		else if (channel.permissionsFor(guildMe).has(['SEND_MESSAGES', 'EMBED_LINKS']))
		{
			if (oldMember.voiceChannel !== newMember.voiceChannel)
			{
				const embed: RichEmbed = new RichEmbed()
					.setAuthor(newMember.displayName, newMember.user.displayAvatarURL, newMember.user.displayAvatarURL)
					.setTimestamp();

				if (!newMember.voiceChannel)
				{
					embed
						.setColor(0xFF4500)
						.setDescription(`${newMember} disconnected from ${oldMember.voiceChannel.name}.`);
				}
				else if (!oldMember.voiceChannel)
				{
					embed
						.setColor(0x7CFC00)
						.setDescription(`${newMember} connected to ${newMember.voiceChannel.name}.`);
				}
				else
				{
					embed
						.setColor(3447003)
						.setDescription(`${newMember} went from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}.`);
				}

				channel.send({ embed })
					.catch((error: DiscordAPIError) =>
					{
						this._client.logger.error('VLOG', error.name, error.code.toString(), error.message);
					});
			}
		}
	}
}
