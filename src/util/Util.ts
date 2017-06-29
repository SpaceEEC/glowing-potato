import { Client } from '../structures/Client';

export class Util
{
	/**
	 * The client associated with the Util class
	 */
	public static client: Client;

	/**
	 * Intializes the Util class.
	 * @param {Client} client The client to associate that class with
	 * @returns {void}
	 * @static
	 */
	public static init(client: Client): void
	{
		this.client = client;
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

}
