import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';

import { PaginatedPage } from '../types/PaginatedPage';

/**
 * Static Util class holding all sort of handy methods.
 * @static
 */
export class Util
{
	/**
	 * Promisified exec from child_process
	 * @param {string} command Command to execute
	 * @param {?ExecOptions} options
	 * @returns {Promise<object>}
	 * @static
	 */
	public static execAsync: (command: string, options?: ({ encoding?: string | null } & ExecOptions))
		=> Promise<{ stdout: string, stderr: string }> = promisify(exec);

	/**
	 * Promisified setTimeout without arguments
	 * @param {number} timeout Time to wait
	 * @returns {Promise<void>}
	 * @static
	 */
	public static wait: (timeout: number) => Promise<void> = promisify(setTimeout) as any;

	/**
	 * Replaces parts of a string determined by the specified object.
	 * @param {string} input The original string
	 * @param {object} dict The object literal with keys as before and values as after the replace
	 * @returns {string}
	 * @static
	 */
	public static replaceMap(input: string, dict: { [key: string]: string }): string
	{
		const regex: string[] = [];
		for (const key of Object.keys(dict))
		{
			regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
		}
		return input.replace(new RegExp(regex.join('|'), 'g'), (w: string) => dict[w]);
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
	 * Converts a number of seconds to a human readable string.
	 * @param {number} seconds The amount of total seconds
	 * @param {boolean} [forceHours=false] Whether to force the display of hours
	 * @returns {string} The final time string
	 * @static
	 */
	public static timeString(seconds: number, forceHours: boolean = false): string
	{
		const hours: number = Math.floor(seconds / 3600);
		const minutes: number = Math.floor(seconds % 3600 / 60);

		return [
			forceHours || hours >= 1 ? `${hours}:` : '',
			`${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:`,
			`0${Math.floor(seconds % 60)}`.slice(-2),
		].join('');
	}

	/**
	 * Paginates the passed array.
	 * @param {T[]} items The original items
	 * @param {number} page The requested page
	 * @param {number} pageLength The length of each page
	 * @returns {PaginatedPage<T>}
	 */
	public static paginate<T>(items: T[], page: number = 1, pageLength: number = 10): PaginatedPage<T>
	{
		const maxPage: number = Math.ceil(items.length / pageLength);
		if (page < 1) page = 1;
		if (page > maxPage) page = maxPage;
		const startIndex: number = (page - 1) * pageLength;
		return {
			items: items.length > pageLength ? items.slice(startIndex, startIndex + pageLength) : items,
			maxPage,
			page,
			pageLength,
		};
	}

	/**
	 * Tries to resolve the input to a boolean, failing so returns null.
	 * @param {string} input The string to resolve
	 * @returns {?boolean} Null when it couldn't resolve
	 * @static
	 */
	public static resolveBoolean(input: string): boolean
	{
		const lowercased: string = input.toLowerCase();
		if (Util._truthy.has(lowercased)) return true;
		if (Util._falsy.has(lowercased)) return false;
		return null;
	}

	// straight copy from
	// https://github.com/Gawdl3y/discord.js-commando/blob/master/src/types/boolean.js#L6-L7
	/**
	 * Set of "truthy" strings
	 * @readonly
	 * @private
	 */
	private static readonly _truthy: Set<string> = new
		Set(['true', 't', 'yes', 'y', 'on', 'enable', 'enabled', '1', '+', 'ja', 'j']);
	/**
	 * Set of "falsy" strings
	 * @readonly
	 * @private
	 */
	private static readonly _falsy: Set<string> = new
		Set(['false', 'f', 'no', 'n', 'off', 'disable', 'disabled', '0', '-', 'nein']);
	// copy end
}
