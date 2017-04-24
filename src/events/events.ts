import { CommandoClient } from 'discord.js-commando';
import guildMemberAddHandler from './guildMemberAdd';
import guildMemberRemoveHandler from './guildMemberRemove';
import voiceStateUpdateHandler from './voiceStateUpdate';

// quality code right here /s
export function registerEvents(client: CommandoClient): void {
	client.on('guildMemberAdd', guildMemberAddHandler);
	client.on('guildMemberRemove', guildMemberRemoveHandler);
	client.on('voiceStateUpdate', voiceStateUpdateHandler);
};
