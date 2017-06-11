import { CommandoClient } from 'discord.js-commando';
import { guildMemberAdd } from './guildMemberAdd';
import { guileMemberRemove } from './guildMemberRemove';
import { voiceStateUpdate } from './voiceStateUpdate';

// quality code right here /s
export function registerEvents(client: CommandoClient): void {
	client.on('guildMemberAdd', guildMemberAdd);
	client.on('guildMemberRemove', guileMemberRemove);
	client.on('voiceStateUpdate', voiceStateUpdate);
}
