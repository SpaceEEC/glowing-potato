import { Collection, Snowflake } from 'discord.js';
import { get, post } from 'snekfetch';
import { Message } from 'yamdbf';

import { Client } from '../structures/Client';
import { RichEmbed } from '../structures/RichEmbed';
import { AnimeData, CharData, MangaData } from '../types/AniListData';
import { AniSettings } from '../types/AniSettings';
import { AniType } from '../types/AniType';
import { ClientCredentials } from '../types/ClientCredentials';
import { Config } from '../types/Config';
import { ProbablyNotABuffer } from '../types/ProbablyNotABuffer';
import { Util } from './Util';

const { anilist }: Config = require('../../config.json');

const replaceChars: { [char: string]: string } = {
	'&#039;': '\'',
	'&amp;': '&',
	'&gt;': '>',
	'&lt;': '<',
	'&quot;': '"',
	'<br />': '\n',
	'<br>': '\n',
	'`': '\'',
};

/**
 * Static AniListUtil class which handles Anilist related commands.
 * @static
 */
export class AnilistUtil
{
	/**
	 * Retrieves and displays a specific anime / character / manga.
	 * @param {AnyType} type The type of data to retrieve and display
	 * @param {string} search The search query
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async run(type: AniType, search: string, message: Message)
		: Promise<void>
	{
		const stringType: string = AniType[type].toLowerCase();
		const token: string = await AnilistUtil._retrieveToken();
		search = encodeURIComponent(search);

		const { body }: {
			body: ProbablyNotABuffer,
		} = await get(`https://anilist.co/api/${stringType}/search/${search}?access_token=${token}`);

		if (body.error)
		{
			if (body.error.messages[0] === 'No Results.')
			{
				return message.channel.send(message, `No ${type} found`)
					.then(() => undefined);
			}
			throw new Error(`there was an error while fetching the data from the server:\n${body.error.messages[0]}`);
		}

		const response: (AnimeData | CharData | MangaData) = body[1]
			? await AnilistUtil._pick(message, body, type)
			: body[0];

		if (!response) return;

		switch (type)
		{
			case AniType.ANIME:
				return AnilistUtil._sendAnime(message, response as AnimeData);
			case AniType.CHARACTER:
				return AnilistUtil._sendCharacter(message, response as CharData);
			case AniType.MANGA:
				return AnilistUtil._sendManga(message, response as MangaData);
			default:
				throw new Error(`Unknown model type: ${type}`);
		}
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

	/**
	 * Retrieves the access token for the anilist API, also updates it when necessary.
	 * @returns {Promise<string>}
	 * @private
	 * @static
	 */
	private static async _retrieveToken(): Promise<string>
	{
		let settings: AniSettings = await AnilistUtil.client.storage.get('aniSettings');
		if (!settings || settings.expires <= Date.now())
		{
			const { body }: { body: ClientCredentials } = await post('https://anilist.co/api/auth/access_token')
				.send({
					client_id: anilist.client_id,
					client_secret: anilist.client_secret,
					grant_type: 'client_credentials',
				}) as ProbablyNotABuffer;

			settings = {
				expires: Date.now() + body.expires_in * 1000,
				token: body.access_token,
			};

			await AnilistUtil.client.storage.set('aniSettings', settings);
		}
		return settings.token;
	}

	/**
	 * Lets the requester pick between one of the found results.
	 * @param {message} message Original message
	 * @param {(AnimeData | CharData | MangaData)[]} dataArray Array of data
	 * @param {AniType} type The requested content type
	 * @returns {Promise<(AnimeData | CharData | MangaData) | void>}
	 * @private
	 * @static
	 */
	private static async _pick(message: Message, dataArray: (AnimeData | CharData | MangaData)[], type: AniType)
		: Promise<(AnimeData | CharData | MangaData) | void>
	{
		const tempArray: string[] = [];
		let count: number = 0;
		if (type === AniType.CHARACTER)
		{
			for (const char of dataArray as CharData[])
			{
				tempArray.push(`${++count}\t\t${char.name_first} ${char.name_last || ''}`);
			}
		}
		else
		{
			for (const data of dataArray as (AnimeData | MangaData)[])
			{
				tempArray.push(`${++count}\t\t${data.title_english}`);
			}
		}

		const embed: RichEmbed = new RichEmbed()
			.setColor(message.member.displayColor)
			.setTitle(`There has been found more than one ${type}`)
			.setDescription(tempArray.join('\n').slice(0, 2000))
			.addField('Notice', `For which ${type} would you like to see additional information?\n\n`
			+ 'To cancel this prompt respond with \`cancel\`, this prompt times out after \`30\` seconds.',
		);

		const prompt: Message = await message.channel.send({ embed }) as Message;

		const response: Message = await message.channel.awaitMessages((
			(m: Message) => m.author.id === message.author.id),
			{ maxMatches: 1, time: 30e3 },
		).then((collected: Collection<Snowflake, Message>) => collected.first());

		prompt.delete().catch(() => null);
		if (response.deletable) response.delete().catch(() => null);

		if (!response || response.content.toLowerCase() === 'cancel')
		{
			if (message.deletable) message.delete().catch(() => null);
			return undefined;
		}

		return dataArray[parseInt(response.content.split(' ')[0]) - 1];
	}

	/**
	 * Formats and outputs the passed anime data.
	 * @param {Message} message The orignal message
	 * @param {AnimeData} animeData Anime data to send
	 * @returns {Prommise<void>}
	 * @private
	 * @static
	 */
	private static _sendAnime(message: Message, animeData: AnimeData): Promise<void>
	{
		const {
			airing_status,
			average_score,
			description,
			end_date_fuzzy,
			genres,
			image_url_lge,
			source,
			start_date_fuzzy,
			title_english,
			title_japanese,
			title_romaji,
			total_episodes,
			type,
		}: AnimeData = animeData;

		const mappedGenres: string = Util.chunkArray(genres, 3).map((chunk: string[]) => chunk.join(', ')).join('\n');

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(image_url_lge)
			.setTitle(title_japanese)
			.setDescription(
			title_romaji === title_english
				? title_english
				: `${title_romaji}\n\n${title_english}`)
			.addField('Genres', mappedGenres, true)
			.addField('Rating | Typ', `${average_score} | ${type}`, true)
			.addField('Episodes', total_episodes, true);

		if (start_date_fuzzy)
		{
			let title: string = 'Start:';
			let value: string = AnilistUtil._formatFuzzy(start_date_fuzzy);
			if (airing_status === 'finished airing')
			{
				title = 'Period:';
				value += ` - ${AnilistUtil._formatFuzzy(end_date_fuzzy) || `Not specified`}`;
			}

			embed.addField(title, value, true);
		}

		embed.splitToFields('Description', description
			? Util.replaceMap(description, replaceChars)
			: 'No description',
		);

		embed.addField('Airing Status:', airing_status, true)
			.addField('Origin:', source || 'Not specified', true);

		return message.channel.send({ embed }).then(() => undefined);
	}

	/**
	 * Formats and outputs the passed character data.
	 * @param {Message} message The orignal message
	 * @param {CharData} charData The char data to send
	 * @returns {Promise<void>}
	 * @private
	 * @static
	 */
	private static _sendCharacter(message: Message, charData: CharData): Promise<void>
	{
		const {
			image_url_lge,
			info,
			name_alt,
			name_first,
			name_japanese,
			name_last,
		}: CharData = charData;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(image_url_lge)
			.setTitle(`${name_first || ''}\u200b ${name_last || ''}`)
			.setDescription(name_japanese || '');

		if (name_alt)
		{
			embed.addField('Aliases:', name_alt);
		}

		embed.splitToFields('Description', info
			? Util.replaceMap(info, replaceChars)
			: 'No description',
		);

		return message.channel.send({ embed }).then(() => undefined);
	}

	/**
	 * Formats and outputs the passed character data.
	 * @param {Message} message The orignal message
	 * @param {MangaData} mangaData The manga data to send
	 * @returns {Promise<void>}
	 * @private
	 * @static
	 */
	private static _sendManga(message: Message, mangaData: MangaData): Promise<void>
	{
		const {
			average_score,
			description,
			end_date_fuzzy,
			genres,
			image_url_lge,
			publishing_status,
			start_date_fuzzy,
			title_english,
			title_japanese,
			title_romaji,
			total_chapters,
			total_volumes,
			type,
		}: MangaData = mangaData;

		const mappedGenres: string = Util.chunkArray(genres, 3).map((chunk: string[]) => chunk.join(', ')).join('\n');

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(image_url_lge)
			.setTitle(title_japanese)
			.setDescription(
			title_japanese === title_english
				? title_english
				: `${title_romaji}\n${title_english}`)
			.addField('Genres', mappedGenres, true)
			.addField('Rating | Typ', `${average_score} | ${type}`, true)
			.addField('Chapters | Volumes', `${total_chapters} | ${total_volumes}`, true);

		if (start_date_fuzzy)
		{
			let title: string = 'Start';
			let value: string = AnilistUtil._formatFuzzy(start_date_fuzzy);
			if (publishing_status === 'finished publishing')
			{
				title = 'Period';
				value += ` - ${AnilistUtil._formatFuzzy(end_date_fuzzy) || `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		embed.splitToFields('Description', description
			? Util.replaceMap(description, replaceChars)
			: 'No description',
		);

		embed.addField('Publishing Status:', publishing_status || 'Not specified', true);

		return message.channel.send({ embed }).then(() => undefined);
	}

	/**
	 * Formats the fuzzy dates provided from anilist. (Using timestamps is way overrated.)
	 * @param {number|string} input - The provided number, can be a string
	 * @returns {string} The formatted output
	 * @private
	 * @static
	 */
	private static _formatFuzzy(input: number | string): string
	{
		if (!input) return '';
		if (typeof input !== 'string') input = String(input);
		return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
	}
}
