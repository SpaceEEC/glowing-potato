import { Message } from 'discord.js';
import { ArgumentCollector, ArgumentCollectorResult, ArgumentInfo, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

export default class Util {

	/**
	 * Replaces parts of a string determined by the specified map or object.
	 * @param {string} input - The string that shall be replaced
	 * @param {map|object} map - The map or object literal with keys and values to replace against.
	 * @returns {string}
	 * @static
	 */
	public static replaceMap(input: string, map: any): string {
		const regex: string[] = [];
		for (const key in map) {
			if (!map[key]) continue;
			regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
		}
		return input.replace(new RegExp(regex.join('|'), 'g'), (w: string) => map[w]);
	}

	private _client: CommandoClient;
	private _prefixMention: RegExp;

	constructor(client: CommandoClient) {
		this._client = client;
		if (client.user) this._prefixMention = new RegExp(`^<@!?${client.user.id}>`);
	}

	/**
	 * Gets the used command (including aliases) from the message.
	 * @param {message} msg The message to get the used command from.
	 * @param {?object} object The optional object, containing key and value pairs to replace matches.
	 * @returns {string}
	 */
	public getUsedAlias(msg: any, map: any = {}): string {
		if (!this._prefixMention) this._prefixMention = new RegExp(`^<@!?${this._client.user.id}>`);

		const prefixLength: number = msg.guild ? this._prefixMention.test(msg.content) ? this._prefixMention.exec(msg.content)[0].length + 1 : msg.guild.commandPrefix.length : 0;
		const alias: string = msg.content.slice(prefixLength).split(' ')[0].toLowerCase();
		return map[alias] || alias;
	}

	/**
	 * Prompts input from user and automatically cleans up after prompting.
	 * @param {CommandMessage} msg - CommandMessage to prompt from.
	 * @param {ArgumentInfo} arg - ArgumentInfo to prompt.
	 * @param {boolean} [exception=false] exception - Whether a FriendlyError should be thrown, upon cancel or ignore, or not. Defaults to false.
	 * @returns {Promise<T>} - The prompted value, or null when not or invalid responded.
	 * @private
	 */
	public async prompt<T>(msg: CommandMessage, arg: ArgumentInfo, exception: boolean = true): Promise<T> {
		const result: ArgumentCollectorResult = await new ArgumentCollector(this._client, [Object.assign(arg, { key: 'key' })], 1).obtain(msg);

		const messages: Message[] = result.prompts.concat(result.answers);
		if (messages.length > 1) await msg.channel.bulkDelete(messages).catch(() => null);
		else if (messages.length === 1) await messages[0].delete().catch(() => null);

		if (exception && result.cancelled && result.cancelled !== 'promptLimit') throw new FriendlyError('cancelled command.');
		else if (result.cancelled) return null;
		return (result.values as { key: T }).key;
	}
}
