import { Message } from 'discord.js';
import { ArgumentCollector, ArgumentCollectorResult, ArgumentInfo, CommandMessage, CommandoClient, FriendlyError, GuildExtension } from 'discord.js-commando';

export default class Util {

	/**
	 * Intializes the Util class.
	 * @param {CommandoClient} client The client to associate that class with
	 * @returns {void}
	 * @static
	 */
	public static init(client: CommandoClient): void {
		Util._client = client;
		Util._prefixMention = new RegExp(`^<@!?${client.user.id}>`);
	}

	/**
	 * Gets the used command or aliases from the message, which triggered the command's execution.
	 * @param {message} msg The message to get the used command or alias from
	 * @param {?object} map The optional object, containing key and value pairs to replace matches
	 * @returns {string}
	 * @static
	 */
	public static getUsedAlias(msg: CommandMessage, map: { [key: string]: string } = {}): string {
		if (!Util._client) throw new Error('Util class has not been intialized!');

		const prefixLength: number = msg.guild
			? Util._prefixMention.test(msg.content)
				? Util._prefixMention.exec(msg.content)[0].length + 1
				: (msg.guild as GuildExtension).commandPrefix.length
			: 0;
		const alias: string = msg.content.slice(prefixLength).split(' ')[0].toLowerCase();
		return map[alias] || alias;
	}

	/**
	 * Prompts input from user and automatically cleans up after prompting.
	 * @param {CommandMessage} msg - CommandMessage to prompt from
	 * @param {ArgumentInfo} arg - ArgumentInfo to prompt
	 * @param {boolean} [exception=false] exception - Whether a FriendlyError should be thrown, upon cancel or ignore, defaults to false
	 * @returns {Promise<T>} - The prompted value, or null when not or invalid responded
	 * @static
	 */
	public static async prompt<T>(msg: CommandMessage, arg: ArgumentInfo, exception: boolean = true): Promise<T> {
		if (!Util._client) throw new Error('Util class has not been intialized!');

		const result: ArgumentCollectorResult = await new ArgumentCollector(Util._client, [Object.assign(arg, { key: 'key' })], 1).obtain(msg);

		const messages: Message[] = result.prompts.concat(result.answers);
		if (messages.length > 1) await msg.channel.bulkDelete(messages).catch(() => null);
		else if (messages.length === 1) await messages[0].delete().catch(() => null);

		if (exception && result.cancelled && result.cancelled !== 'promptLimit') throw new FriendlyError('cancelled command.');
		else if (result.cancelled) return null;
		return (result.values as { key: T }).key;
	}

	/**
	 * Replaces parts of a string determined by the specified map or object.
	 * @param {string} input - The string that shall be replaced
	 * @param {map|object} map - The map or object literal with keys and values to replace against
	 * @returns {string}
	 * @static
	 */
	public static replaceMap(input: string, map: { [key: string]: string }): string {
		const regex: string[] = [];
		for (const key in map) {
			if (!map[key]) continue;
			regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
		}
		return input.replace(new RegExp(regex.join('|'), 'g'), (w: string) => map[w]);
	}

	/** The client */
	private static _client: CommandoClient;
	/** The prefix mention for the client */
	private static _prefixMention: RegExp;
}
