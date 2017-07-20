import { DiscordAPIError, GuildChannel, GuildMember, TextChannel } from 'discord.js';
import { GuildStorage, ListenerUtil } from 'yamdbf';

import { GuildConfigChannels, GuildConfigStrings } from '../types/GuildConfigKeys';
import { RavenUtil } from '../util/RavenUtil';
import { Client } from './Client';
import { RichEmbed } from './RichEmbed';

const { on, registerListeners } = ListenerUtil;

/**
 * Class to handle all not client relevant events in one place.
 */
export class EventHandlers
{
	private _client: Client;

	/**
	 * Instantiates the EventHandlers class
	 * Is not meant to be instantiated multiple times
	 * @param {Client} client
	 */
	public constructor(client: Client)
	{
		this._client = client;
		registerListeners(this._client, this);
	}

	/**
	 * Handles new members and their join message if applicable
	 * @param {GuildMember} member New member that joined a guild
	 * @returns {Promise<void>}
	 * @private
	 */
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
						RavenUtil.error('Join:LogChannel', error);
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
						RavenUtil.error('Join:AnChannel', error);
					});
			}
		}
	}

	/**
	 * Handles left members and their leave message if applicable
	 * @param {GuildMember} member Member that left a guild
	 * @returns {Promise<void>}
	 * @private
	 */
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
						RavenUtil.error('Leave:LogChannel', error);
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
						RavenUtil.error('Leave:AnChannel', error);
					});
			}
		}
	}

	/**
	 * Handles a voice state update for an voice log if applicable,
	 * or an empty channel in case music is being played at the moment.
	 * @param {GuildMember} oldMember Member before the update
	 * @param {GuildMember} newMember Member after the update
	 * @returns {Promise<void>}
	 * @private
	 */
	@on('voiceStateUpdate')
	public async _onVoiceStateUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void>
	{
		this._client.musicPlayer.handleVoiceStateUpdate(oldMember, newMember);

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
						RavenUtil.error('VLOG', error);
					});
			}
		}
	}
}
