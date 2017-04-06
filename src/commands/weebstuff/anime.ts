import { stripIndents } from 'common-tags';
import { Message, RichEmbed } from 'discord.js';
import { Argument, ArgumentCollector, ArgumentCollectorResult, ArgumentInfo, Command, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import * as request from 'superagent';
import { animeData, aniSettings, charData, formatFuzzy, mangaData, updateToken } from '../../util/anistuff.js';
import Util from '../../util/util';

type args = { search: string, cmd: string };
type error = { error: { messages: {}[] } };

export default class AnimeCommand extends Command {
	private util: Util;
	constructor(client: CommandoClient) {
		super(client, {
			name: 'anime',
			aliases: ['manga', 'character', 'char'],
			group: 'weebstuff',
			memberName: 'anime',
			description: 'Displays informations about the specified anime.\n**manga:** Displays informations about the specified manga.\n**character:** Displays informations about the specified character.',
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
				}
			]
		});
		this.util = new Util(client);
	}

	public async run(msg: CommandMessage, args: args): Promise<Message | Message[]> {
		if (args.search.includes('?')) throw new FriendlyError('please don\'t use `?` in the search, it would break the request.');
		args.cmd = Util.getUsedAlias(msg, { char: 'character' });
		const aniSettings: aniSettings = await updateToken(this.client, msg, this.client.settings.get('aniSettings', { expires: 0 }));
		const responses: animeData[] | mangaData[] | charData[] = await this.query(msg, aniSettings, args);
		if (responses[1]) {
			responses[0] = await this.select(msg, responses, args);
		}
		if (!responses[0]) return msg.say('Aborting then.');
		if (args.cmd === 'character') return this.sendCharacter(msg, (responses[0] as charData));
		if (args.cmd === 'manga') return this.sendManga(msg, (responses[0] as mangaData));
		if (args.cmd === 'anime') return this.sendAnime(msg, (responses[0] as animeData));
		this.client.emit('error', `[anime.js] Unknown model type: ${args.cmd}`);
		throw new Error('unknown type.');
	}

	private async query(msg: CommandMessage, aniSettings: aniSettings, args: args): Promise<animeData[] | mangaData[] | charData[]> {
		const response: request.Response = await request.get(`https://anilist.co/api/${args.cmd}/search/${args.search}?access_token=${aniSettings.token}`);
		if ((response.body as error).error) {
			if ((response.body as error).error.messages[0] === 'No Results.') {
				throw new FriendlyError(`no ${args.cmd} found.`);
			} else {
				this.client.emit('error', `[anime.js]: Error while fetching: ${(response.body as error).error.messages[0]}`);
				throw new FriendlyError(stripIndents`there was an error while fetching the data from the server:
        ${(response.body as error).error.messages[0]}`);
			}
		}
		return (response.body as animeData[] | mangaData[] | charData[]);
	}

	private mapResponses(response: animeData[] | mangaData[] | charData[], type: string): [number, string] {
		let count: number = 1;
		if (type === 'character') {
			const mapped: string = (response as charData[]).map((r: charData) => `${count++}\t\t${r.name_first} ${r.name_last ? r.name_last : ''}`).join('\n');
			return [count, mapped];
		} else {
			const mapped: string = (response as animeData[]).map((r: animeData) => `${count++}\t\t${r.title_english}`).join('\n');
			return [count, mapped];
		}
	}

	private async select(msg: CommandMessage, response: mangaData[] | animeData[] | charData[], args: args, second: boolean = false): Promise<null | mangaData | animeData | charData> {
		const [count, description]: [number, string] = this.mapResponses(response, args.cmd);
		const message: Message = await msg.embed(new RichEmbed().setColor(msg.member.displayColor)
			.setTitle(`There has been found more than one ${args.cmd}:`)
			.setDescription(description)) as Message;

		const argument: ArgumentInfo = {
			key: 'entry',
			prompt: `For which ${args.cmd} would you like to see additional output?`,
			type: 'integer',
			min: 1,
			max: count
		};

		const userInput: number = await this.util.prompt<number>(msg, argument, false);
		message.delete().catch(() => null);

		if (!userInput) return null;
		else return response[userInput - 1];
	};

	private sendCharacter(msg: CommandMessage, charInfo: charData): Promise<Message | Message[]> {
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(charInfo.image_url_lge)
			.setTitle(`${charInfo.name_first ? charInfo.name_first : ''} ${charInfo.name_last ? charInfo.name_last : ''}`)
			.setDescription(`${charInfo.name_japanese}\n\n${charInfo.name_alt ? `Aliases:\n${charInfo.name_alt}` : ''}`);

		charInfo.info = charInfo.info === null ? 'No description' : Util.replaceMap(charInfo.info, { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '`': '\'', '<br>': '\n', '<br />': '\n' });

		if (charInfo.info.length < 1025) {
			embed.addField('Description', charInfo.info);
		} else {
			const description: string[] = charInfo.info.match(/(.|[\r\n]){1,1024}/g);

			for (const i in description) {
				if (!description[i]) continue;
				embed.addField(i === '0' ? 'Description' : '\u200b',
					description[i]);
			}
		}

		return msg.embed(embed);
	}

	private sendManga(msg: CommandMessage, mangaInfo: mangaData): Promise<Message | Message[]> {
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(mangaInfo.image_url_lge)
			.setTitle(mangaInfo.title_japanese)
			.setDescription(mangaInfo.title_japanese === mangaInfo.title_english ? mangaInfo.title_english : `${mangaInfo.title_romaji}\n${mangaInfo.title_english}`)
			.addField('Genres', mangaInfo.genres.join(', '), true)
			.addField('Rating | Typ', `${mangaInfo.average_score} | ${mangaInfo.type}`, true)
			.addField('Chapters | Volumes', `${mangaInfo.total_chapters} | ${mangaInfo.total_volumes}`, true);

		if (mangaInfo.start_date_fuzzy) {
			let title: string = 'Start';
			let value: string = formatFuzzy(mangaInfo.start_date_fuzzy);
			if (mangaInfo.publishing_status && mangaInfo.publishing_status === 'finished publishing') {
				title = 'Period';
				value += ` - ${mangaInfo.end_date_fuzzy ? formatFuzzy(mangaInfo.end_date_fuzzy) : `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		mangaInfo.description = mangaInfo.description === null ? 'No description' : Util.replaceMap(mangaInfo.description, { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '`': '\'', '<br>': '\n', '<br />': '\n' });

		if (mangaInfo.description.length < 1025) {
			embed.addField('Description', mangaInfo.description);
		} else {
			const description: string[] = mangaInfo.description.match(/(.|[\r\n]){1,1024}/g);
			for (const i in description) {
				if (!description[i]) continue;
				embed.addField(i === '0' ? 'Description' : '\u200b',
					description[i]);
			}
		}

		embed.addField('Publishing Status:', `${mangaInfo.publishing_status}`.replace('null', 'Not specified'), true);

		return msg.embed(embed);
	}

	private sendAnime(msg: CommandMessage, animeInfo: animeData): Promise<Message | Message[]> {
		const embed: RichEmbed = new RichEmbed()
			.setColor(0x0800ff)
			.setThumbnail(animeInfo.image_url_lge)
			.setTitle(animeInfo.title_japanese)
			.setDescription(animeInfo.title_romaji === animeInfo.title_english
				? animeInfo.title_english
				: `${animeInfo.title_romaji}\n${animeInfo.title_english}`)
			.addField('Genres', animeInfo.genres.join(', '), true)
			.addField('Rating | Typ', `${animeInfo.average_score} | ${animeInfo.type}`, true)
			.addField('Episodes', animeInfo.total_episodes, true);

		if (animeInfo.start_date_fuzzy) {
			let title: string = 'Start:';
			let value: string = formatFuzzy(animeInfo.start_date_fuzzy);
			if (animeInfo.airing_status && animeInfo.airing_status === 'finished airing') {
				title = 'Period:';
				value += ` - ${animeInfo.end_date_fuzzy ? formatFuzzy(animeInfo.end_date_fuzzy) : `Not specified`}`;
			}
			embed.addField(title, value, true);
		}

		animeInfo.description = animeInfo.description === null ? 'No description' : Util.replaceMap(animeInfo.description, { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '`': '\'', '<br>': '\n', '<br />': '\n' });

		if (animeInfo.description.length < 1025) {
			embed.addField('Description', animeInfo.description);
		} else {
			const description: string[] = animeInfo.description.match(/(.|[\r\n]){1,1024}/g);
			for (const i in description) {
				if (!description[i]) continue;
				embed.addField(i === '0' ? 'Description' : '\u200b',
					description[i]);
			}
		}

		embed.addField('Airing Status:', animeInfo.airing_status, true)
			.addField('Origin:', `${animeInfo.source}`.replace('null', 'Not specified'), true);

		return msg.embed(embed);
	}
};
