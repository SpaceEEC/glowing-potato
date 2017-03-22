import { Message, RichEmbed } from 'discord.js';
import { CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'superagent';
const { anilist } = require('../auth.json');

type clientCredentias = {
	/**
	 * The access token, which is required to use the api
	 */
	access_token: string,
	/**
	 * The type of the token.
	 */
	token_type: string,
	/**
	 * The timestamp indicating when the token expires.
	 */
	expires: number,
	/**
	 * The time in ms until the token expires.
	 */
	expires_in: number
};

export type aniSettings = {
	/**
	 * The timestamp indicating when the token expires.
	 */
	expires: number,
	/**
 	* The access token, which is required to use the api
 	*/
	token: string
};

export type animeData = {
	id: number;
	series_type: string;
	title_romaji: string;
	title_english: string;
	title_japanese: string;
	type: string;
	start_date_fuzzy: number;
	end_date_fuzzy: number;
	season: number;
	description: string;
	synonyms: string[];
	genres: string[];
	adult: string;
	average_score: number;
	popularity: number;
	image_url_sml: string;
	image_url_med: string;
	image_url_lge: string;
	image_url_banner: string;
	updated_at: number;
	score_distribution: { '10': number, '20': number, '30': number, '40': number, '50': number, '60': number, '70': number, '80': number, '90': number, '100': number };
	list_stats: { 'completed': number, 'on_hold': number, 'dropped': number, 'plan_to_watch': number, 'watching': number };
	total_episodes: number;
	duration: number;
	airing_status: string;
	youtube_id: string;
	hashtag: string;
	source: string;
};

export type mangaData = {
	id: number;
	series_type: string;
	title_romaji: string;
	title_english: string;
	title_japanese: string;
	type: string;
	start_date_fuzzy: number;
	end_date_fuzzy: number;
	season: number;
	description: string;
	synonyms: string[];
	genres: string[];
	adult: string;
	average_score: number;
	popularity: number;
	image_url_sml: string;
	image_url_med: string;
	image_url_lge: string;
	image_url_banner: string;
	updated_at: number;
	score_distribution: { '10': number, '20': number, '30': number, '40': number, '50': number, '60': number, '70': number, '80': number, '90': number, '100': number };
	list_stats: { 'completed': number, 'on_hold': number, 'dropped': number, 'plan_to_watch': number, 'watching': number };
	total_chapters: number;
	total_volumes: number;
	publishing_status: string;
};

export type charData = {
	name_alt: string,
	info: string,
	id: number,
	name_first: string,
	name_last: string,
	name_japanese: string,
	image_url_lge: string,
	image_url_med: string,
	role: string
};

/**
 * Updates the access token for the anilist API.
 * @param {Commandoclient} client - The client.
 * @param {Message} msg - The message to change on update.
 * @param {aniSettings} aniSettings - The settings to compare the timestamp against.
 * @returns {aniSettings} The new aniSettings.
 */
export async function updateToken(client: CommandoClient, msg: CommandMessage, aniSettings: aniSettings): Promise<aniSettings> {
	if (aniSettings.expires <= Math.floor(Date.now() / 1000) + 300) {
		const statusMessage: Message = await msg.embed(
			new RichEmbed().setColor(0xffff00)
				.setDescription('The token expired, a new one will be requested.\nThis may take a while.')
		) as Message;
		const res: clientCredentias = (await request.post(`https://anilist.co/api/auth/access_token`)
			.send({
				grant_type: 'client_credentials',
				client_id: anilist.client_id,
				client_secret: anilist.client_secret,
			})).body as clientCredentias;
		aniSettings = {
			token: res.access_token,
			expires: res.expires
		};
		client.settings.set('aniSettings', aniSettings);
		await statusMessage.edit({
			embed: new RichEmbed().setColor(0x00ff08)
				.setDescription('Successfully requested a new token, proceeding with your request now.'),
		});
		statusMessage.delete(30000).catch(() => null);
	}
	return aniSettings;
}

/**
 * Formats the fuzzy dates provided from anilist. (Using timestamps is way overrated.)
 * @param {number} input - The provided number, can be a string.
 */
export function formatFuzzy(input: any): string {
	input = input.toString();
	return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
}