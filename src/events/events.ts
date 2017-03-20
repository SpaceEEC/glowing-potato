import { CommandoClient } from 'discord.js-commando';
import { GuildMemberAdd } from './guildMemberAdd';
import { GuildMemberRemove } from './guildMemberRemove';
import { VoiceStateUpdate } from './voiceStateUpdate';

// quality code right here /s
export function registerEvents(client: CommandoClient): void {
	GuildMemberAdd(client);
	GuildMemberRemove(client);
	VoiceStateUpdate(client);
};
