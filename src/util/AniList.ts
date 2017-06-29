import { Collection, RichEmbed, Snowflake } from 'discord.js';
import { get, post } from 'snekfetch';
import { Message } from 'yamdbf';

import { Client } from '../structures/Client';
import { AnimeData } from '../types/AnimeData';
import { AniSettings } from '../types/AniSettings';
import { AniType } from '../types/AniType';
import { CharData } from '../types/CharData';
import { ClientCredentials } from '../types/ClientCredentials';
import { Config } from '../types/Config';
import { MangaData } from '../types/MangaData';
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
 * Static class which handles Anilist related commands.
 * @static
 */
export class AnilistUtil
{
	/**
	 * Retrieves and displays a specific anime / character / char.
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
			? await AnilistUtil._pick(message, body, stringType)
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
	 * @param {string} type String representation of the requested content type
	 * @returns {Promise<(AnimeData | CharData | MangaData) | void>}
	 * @private
	 * @static
	 */
	private static async _pick(message: Message, dataArray: (AnimeData | CharData | MangaData)[], type: string)
		: Promise<(AnimeData | CharData | MangaData) | void>
	{
		const tempArray: string[] = [];
		let count: number = 0;
		if (type === 'character')
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
		const genres: string = Util.chunkArray(animeData.genres, 3).map((chunk: string[]) => chunk.join(', ')).join('\n');

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(animeData.image_url_lge)
			.setTitle(animeData.title_japanese)
			.setDescription(
			animeData.title_romaji === animeData.title_english
				? animeData.title_english
				: `${animeData.title_romaji}\n\n${animeData.title_english}`)
			.addField('Genres', genres, true)
			.addField('Rating | Typ', `${animeData.average_score} | ${animeData.type}`, true)
			.addField('Episodes', animeData.total_episodes, true);

		if (animeData.start_date_fuzzy)
		{
			let title: string = 'Start:';
			let value: string = AnilistUtil._formatFuzzy(animeData.start_date_fuzzy);
			if (animeData.airing_status === 'finished airing')
			{
				title = 'Period:';
				value += ` - ${AnilistUtil._formatFuzzy(animeData.end_date_fuzzy) || `Not specified`}`;
			}

			embed.addField(title, value, true);
		}

		const description: string[] = animeData.description
			? Util.replaceMap(animeData.description, replaceChars).match(/(.|[\r\n]){1,1024}/g)
			: ['No description'];

		for (const [i, chunk] of description.entries())
		{
			embed.addField(i ? '\u200b' : 'Description', chunk);
		}

		embed.addField('Airing Status:', animeData.airing_status, true)
			.addField('Origin:', animeData.source || 'Not specified', true);

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
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(charData.image_url_lge)
			.setTitle(`${charData.name_first || ''}\u200b ${charData.name_last || ''}`)
			.setDescription(charData.name_japanese || '');

		if (charData.name_alt)
		{
			embed.addField('Aliases:', charData.name_alt);
		}

		const description: string[] = charData.info
			? Util.replaceMap(charData.info, replaceChars).match(/(.|[\r\n]){1,1024}/g)
			: ['No description'];

		for (const [i, chunk] of description.entries())
		{
			embed.addField(i ? '\u200b' : 'Description', chunk);
		}

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
		const genres: string = Util.chunkArray(mangaData.genres, 3).map((chunk: string[]) => chunk.join(', ')).join('\n');

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(mangaData.image_url_lge)
			.setTitle(mangaData.title_japanese)
			.setDescription(
			mangaData.title_japanese === mangaData.title_english
				? mangaData.title_english
				: `${mangaData.title_romaji}\n${mangaData.title_english}`)
			.addField('Genres', genres, true)
			.addField('Rating | Typ', `${mangaData.average_score} | ${mangaData.type}`, true)
			.addField('Chapters | Volumes', `${mangaData.total_chapters} | ${mangaData.total_volumes}`, true);

		if (mangaData.start_date_fuzzy)
		{
			let title: string = 'Start';
			let value: string = AnilistUtil._formatFuzzy(mangaData.start_date_fuzzy);
			if (mangaData.publishing_status === 'finished publishing')
			{
				title = 'Period';
				value += ` - ${AnilistUtil._formatFuzzy(mangaData.end_date_fuzzy) || `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		const description: string[] = mangaData.description
			? Util.replaceMap(mangaData.description, replaceChars).match(/(.|[\r\n]){1,1024}/g)
			: ['No description'];

		for (const [i, chunk] of description.entries())
		{
			embed.addField(i ? '\u200b' : 'Description', chunk);
		}

		embed.addField('Publishing Status:', mangaData.publishing_status || 'Not specified', true);

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
