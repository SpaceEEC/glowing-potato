import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { ArgumentInfo, Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';

import { animeData, aniSettings, charData, formatFuzzy, mangaData, replaceChars, updateToken, } from '../../util/anistuff.js';
import Util from '../../util/util';

const { get }: { get: any } = require('snekfetch');

type args = { search: string, cmd: string };
type error = { error: { messages: {}[] } };

export default class AnimeCommand extends Command {

	constructor(client: CommandoClient) {
		super(client, {
			name: 'anime',
			aliases: ['manga', 'character', 'char'],
			group: 'weebstuff',
			memberName: 'anime',
			description: stripIndents`Displays information about the specified anime.

			Subcommands - call with their alias:
			**manga:** Displays information about the specified manga.
			**character:** Displays information about the specified character.
			\u200b`,
			examples: [
				'`anime Bakemonogatari` Shows a list of shows that match this search and lets you pick one of those for a detailed view.',
				'`manga Hyouka` Shows a list of mangas that match this search and lets you pick one of those for a detailed view.',
				'`char hachiman hikigaya` shows information for him, search can be used the same as for the commands above.'
			],
			guildOnly: true,
			args: [
				{
					key: 'search',
					prompt: 'what or who would you like to lookup?\n',
					type: 'string',
					parse: (value: string) => encodeURIComponent(value)
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: args): Promise<Message | Message[]> {
		args.cmd = Util.getUsedAlias(msg, { char: 'character' });
		const aniSettings: aniSettings = await updateToken(this.client, msg, this.client.provider.get('global', 'aniSettings', { expires: 0 }));
		const responses: animeData[] | mangaData[] | charData[] = await this._query(msg, aniSettings, args);

		if (responses[1]) responses[0] = await this._select(msg, responses, args);
		if (!responses[0]) return msg.say('Aborting then.').then((message: Message) => message.delete(3000));

		if (args.cmd === 'character') return this._sendCharacter(msg, (responses[0] as charData));
		if (args.cmd === 'manga') return this._sendManga(msg, (responses[0] as mangaData));
		if (args.cmd === 'anime') return this._sendAnime(msg, (responses[0] as animeData));
		throw new Error(`Unknown model type: ${args.cmd}`);
	}

	private async _query(msg: CommandMessage, aniSettings: aniSettings, args: args): Promise<animeData[] | mangaData[] | charData[]> {
		const { body }: { body: any } = await get(`https://anilist.co/api/${args.cmd}/search/${args.search}?access_token=${aniSettings.token}`);
		if (!body.error) return body as animeData[] | mangaData[] | charData[];

		if (body.error.messages[0] === 'No Results.') throw new FriendlyError(`no ${args.cmd} found.`);
		else throw new Error(`there was an error while fetching the data from the server:\n${body.error.messages[0]}`);

	}

	private _mapResponses(response: animeData[] | mangaData[] | charData[], type: string): [string, number] {
		let count: number = 1;
		if (type === 'character') {
			return [(response as charData[]).map((r: charData) => `${count++}\t\t${r.name_first} ${r.name_last ? r.name_last : ''}`).join('\n'), count];
		} else {
			return [(response as animeData[]).map((r: animeData) => `${count++}\t\t${r.title_english}`).join('\n'), count];
		}
	}

	private async _select(msg: CommandMessage, response: mangaData[] | animeData[] | charData[], args: args, second: boolean = false): Promise<null | mangaData | animeData | charData> {
		const [description, count]: [string, number] = this._mapResponses(response, args.cmd);
		const message: Message = await msg.embed(new RichEmbed().setColor(msg.member.displayColor)
			.setTitle(`There has been found more than one ${args.cmd}:`)
			.setDescription(description)) as Message;

		const argument: ArgumentInfo = {
			key: 'entry',
			prompt: `For which ${args.cmd} would you like to see additional information?`,
			type: 'integer',
			min: 1,
			max: count
		};

		const userInput: number = await Util.prompt<number>(msg, argument, false);
		message.delete().catch(() => null);

		if (!userInput) return null;
		else return response[userInput - 1];
	};

	private _sendCharacter(msg: CommandMessage, charInfo: charData): Promise<Message | Message[]> {
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(charInfo.image_url_lge)
			.setTitle(`${charInfo.name_first || ''}\u200b ${charInfo.name_last || ''}`)
			.setDescription(stripIndents`${charInfo.name_japanese || ''}}\u200b
			
			${charInfo.name_alt ? `Aliases:\n${charInfo.name_alt}` : ''}`);

		charInfo.info = Util.replaceMap(charInfo.info, replaceChars) || 'No description';

		if (charInfo.info.length < 1025) {
			embed.addField('Description', charInfo.info);
		} else {
			const description: string[] = charInfo.info.match(/(.|[\r\n]){1,1024}/g);

			for (let i: number = 0; i < description.length; i++) {
				embed.addField(i ? '\u200b' : 'Description', description[i]);
			}
		}

		return msg.embed(embed);
	}

	private _sendManga(msg: CommandMessage, mangaInfo: mangaData): Promise<Message | Message[]> {
		let genres: string = '';
		for (const genre of mangaInfo.genres) genres += ((mangaInfo.genres.indexOf(genre) % 3) - 2) ? `${genre},\n` : `${genre}, `;

		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(mangaInfo.image_url_lge)
			.setTitle(mangaInfo.title_japanese)
			.setDescription(mangaInfo.title_japanese === mangaInfo.title_english
				? mangaInfo.title_english
				: `${mangaInfo.title_romaji}\n${mangaInfo.title_english}`)
			.addField('Genres', genres.slice(0, -1), true)
			.addField('Rating | Typ', `${mangaInfo.average_score} | ${mangaInfo.type}`, true)
			.addField('Chapters | Volumes', `${mangaInfo.total_chapters} | ${mangaInfo.total_volumes}`, true);

		if (mangaInfo.start_date_fuzzy) {
			let title: string = 'Start';
			let value: string = formatFuzzy(mangaInfo.start_date_fuzzy);
			if (mangaInfo.publishing_status === 'finished publishing') {
				title = 'Period';
				value += ` - ${formatFuzzy(mangaInfo.end_date_fuzzy) || `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		mangaInfo.description = Util.replaceMap(mangaInfo.description, replaceChars) || 'No description';

		if (mangaInfo.description.length < 1025) {
			embed.addField('Description', mangaInfo.description);
		} else {
			const description: string[] = mangaInfo.description.match(/(.|[\r\n]){1,1024}/g);
			for (let i: number = 0; i < description.length; i++) {
				embed.addField(i ? '\u200b' : 'Description', description[i]);
			}
		}

		embed.addField('Publishing Status:', mangaInfo.publishing_status || 'Not specified', true);

		return msg.embed(embed);
	}

	private _sendAnime(msg: CommandMessage, animeInfo: animeData): Promise<Message | Message[]> {
		let genres: string = '';
		for (const genre of animeInfo.genres) genres += ((animeInfo.genres.indexOf(genre) % 3) - 2) ? `${genre}, ` : `${genre},\n`;
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(animeInfo.image_url_lge)
			.setTitle(animeInfo.title_japanese)
			.setDescription(animeInfo.title_romaji === animeInfo.title_english
				? animeInfo.title_english
				: `${animeInfo.title_romaji}\n${animeInfo.title_english}`)
			.addField('Genres', genres.slice(0, -1), true)
			.addField('Rating | Typ', `${animeInfo.average_score} | ${animeInfo.type}`, true)
			.addField('Episodes', animeInfo.total_episodes, true);

		if (animeInfo.start_date_fuzzy) {
			let title: string = 'Start:';
			let value: string = formatFuzzy(animeInfo.start_date_fuzzy);
			if (animeInfo.airing_status === 'finished airing') {
				title = 'Period:';
				value += ` - ${formatFuzzy(animeInfo.end_date_fuzzy) || `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		animeInfo.description = Util.replaceMap(animeInfo.description, replaceChars) || 'No description';

		if (animeInfo.description.length < 1025) {
			embed.addField('Description', animeInfo.description);
		} else {
			const description: string[] = animeInfo.description.match(/(.|[\r\n]){1,1024}/g);
			for (let i: number = 0; i < description.length; i++) {
				embed.addField(i ? '\u200b' : 'Description', description[i]);
			}
		}

		embed.addField('Airing Status:', animeInfo.airing_status, true)
			.addField('Origin:', animeInfo.source || 'Not specified', true);

		return msg.embed(embed);
	}
};
