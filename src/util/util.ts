import { CommandMessage } from 'discord.js-commando';
const prefixMention: RegExp = new RegExp(`^<@!?257884228451041280>`);
/**
 * Replaces parts of a string determined by the specified map or object.
 * @param {string} input - The string that shall be replaced
 * @param {map|object} map - The map or object literal with keys and values to replace against.
 * @returns {string}
 */
export function replaceMap(input: string, map: any): string {
	const regex: string[] = [];
	for (const key in map) {
		if (!map[key]) continue;
		regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
	}
	return input.replace(new RegExp(regex.join('|'), 'g'), (w: string) => map[w]);
}

/**
 * Gets the used command (including aliases) from the message.
 * @param {message} msg The message to get the used command from.
 * @param {?object} object The optional object, containing key and value pairs to replace matches.
 * @returns {string}
 */
export function getUsedAlias(msg: any, map: any = {}): string {
	const prefixLength: number = msg.guild ? prefixMention.test(msg.content) ? prefixMention.exec(msg.content)[0].length + 1 : msg.guild.commandPrefix.length : 0;
	const alias: string = msg.content.slice(prefixLength).split(' ')[0].toLowerCase();
	return map[alias] || alias;
}
