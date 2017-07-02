import { Client } from '../structures/Client';
import { GuildConfigChannels, GuildConfigRoles, GuildConfigStrings, GuildConfigType } from '../types/GuildConfigKeys';
import { Util } from './Util';

/**
 * Static GuildConfigUtil class holding useful methods and props to interact with the guild config enum types.
 * @static
 */
export class GuildConfigEnumUtil
{
	/**
	 * All available config keys for all types.
	 * @static
	 */
	public static allConfigKeys: string[] = Object.getOwnPropertyNames(GuildConfigChannels).concat(
		Object.getOwnPropertyNames(GuildConfigRoles),
		Object.getOwnPropertyNames(GuildConfigStrings),
	);

	/**
	 * Tries to parse a string to their config type.
	 * Returns null when no suitable type was found.
	 * @param {string} key
	 * @returns {?GuildConfigType}
	 * @static
	 */
	public static parseConfigType(key: string): GuildConfigType
	{
		// string enums are not indexed with numbers <.<
		const uppercased: any = key.toUpperCase();
		if (GuildConfigChannels.hasOwnProperty(uppercased))
		{
			return GuildConfigType.CHANNEL;
		}
		if (GuildConfigRoles.hasOwnProperty(uppercased))
		{
			return GuildConfigType.ROLE;
		}
		if (GuildConfigStrings.hasOwnProperty(uppercased))
		{
			return GuildConfigType.STRING;
		}

		return null;
	}

	/**
	 * Parses the inputted string to it's correct string value.
	 * @param {string} key
	 * @returns {?string}
	 * @static
	 */
	public static parseConfigKey(key: string): string
	{
		// same here >.>
		const uppercased: any = key.toUpperCase();
		return GuildConfigChannels[uppercased]
			|| GuildConfigRoles[uppercased]
			|| GuildConfigStrings[uppercased]
			|| null;
	}

	/**
	 * Shortcut to `Util.client`
	 * @readonly
	 * @static
	 */
	public static get client(): Client
	{
		return Util.client;
	}
}
