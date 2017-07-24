import { GuildConfigChannels, GuildConfigRoles, GuildConfigStrings, GuildConfigType } from '../types/GuildConfigKeys';

/**
 * Static GuildConfigUtil class holding useful methods and props to interact with the guild configs.
 * @static
 */
export class GuildConfigUtil
{
	/**
	 * All available config keys for all types.
	 * @readonly
	 * @static
	 */
	public static readonly allConfigKeys: string[] = Object.keys(GuildConfigChannels).concat(
		Object.keys(GuildConfigRoles),
		Object.keys(GuildConfigStrings),
	);

	/**
	 * All available config values for all types.
	 * @readonly
	 * @static
	 */
	public static readonly allConfigValues: string[] = Object.values(GuildConfigChannels).concat(
		Object.values(GuildConfigRoles),
		Object.values(GuildConfigStrings),
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
		const uppercased: string = key.toUpperCase();
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
		// string enums are not indexed with numbers <.<
		const uppercased: any = key.toUpperCase();
		return GuildConfigChannels[uppercased]
			|| GuildConfigRoles[uppercased]
			|| GuildConfigStrings[uppercased]
			|| null;
	}
}
