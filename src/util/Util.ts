import { Client } from '../structures/Client';

/**
 * Static Util class holding all sort of handy methods.
 * @static
 */
export class Util
{
	/**
	 * The client associated with the Util class
	 * @static
	 * @readonly
	 */
	public static get client(): Client
	{
		if (!Util._client)
		{
			throw new Error('Util class has not been initialized (yet)!');
		}
		return Util._client;
	}

	/**
	 * Initializes the Util class.
	 * @param {Client} client The client to associate the class with
	 * @returns {void}
	 * @static
	 */
	public static init(client: Client): void
	{
		Util._client = client;
	}

	/**
	 * Replaces parts of a string determined by the specified object.
	 * @param {string} input The original string
	 * @param {object} dict The object literal with keys as before and values as after the replace
	 * @returns {string}
	 * @static
	 */
	public static replaceMap(input: string, map: { [key: string]: string }): string
	{
		const regex: string[] = [];
		for (const key of Object.keys(map))
		{
			regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
		}
		return input.replace(new RegExp(regex.join('|'), 'g'), (w: string) => map[w]);
	}

	/**
	 * Splits an array into smaller chunks.
	 * The original array will not be modified.
	 * @param {T[]} input The array to split
	 * @param {number} chunkSize The size of the chunks
	 * @returns {T[][]}
	 * @static
	 */
	public static chunkArray<T = string>(input: T[], chunkSize: number): T[][]
	{
		const chunks: T[][] = [];
		const length: number = Math.ceil(input.length / chunkSize);

		for (let i: number = 0; i < length; ++i)
		{
			chunks.push(input.slice(i * chunkSize, ++i * chunkSize));
		}

		return chunks;
	}

	/**
	 * The client associated with the Util class
	 * @private
	 * @static
	 */
	private static _client: Client;
}
