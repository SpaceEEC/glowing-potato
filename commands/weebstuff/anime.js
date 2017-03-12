const { Command, FriendlyError } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndent } = require('common-tags');
const request = require('superagent');
const { updateToken, formatFuzzy } = require('../../util/anistuff.js');
const { replaceMap, getUsedAlias } = require('../../util/util.js');

module.exports = class AnimeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'anime',
			aliases: ['manga', 'character', 'char'],
			group: 'weebstuff',
			memberName: 'anime',
			description: 'Displays informations about the specified anime, manga, or character.',
			examples: [
				'`anime Bakemonogatari` Shows a list of shows that match this search and lets you pick one of those for a detailed view.',
				'`manga Hyouka` Shows a list of mangas that match this search and lets you pick one of those for a detailed view.'
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
	}

	async run(msg, args) {
		if (args.search.includes('?')) throw new FriendlyError('please don\'t use `?` in the search, because that would break the request.');
		msg.cmd = getUsedAlias(msg, { char: 'character' });
		const aniSettings = await updateToken(this.client, msg, this.client.settings.get('aniSettings', { expires: 0 }));
		const response = await this.query(msg, aniSettings, args);
		this.send(response[1] ? await this.select(msg, response) : response[0], msg);
	}

	async select(msg, response, second) {
		let count = 1;
		const message = await msg.embed(
			new Embed().setColor(msg.member.displayColor)
				.setTitle(`There has been found more than one ${msg.cmd}:`)
				.setDescription(response.map(r => `${count++}\t\t${msg.cmd === 'character' ? `${r.name_first} ${r.name_last ? r.name_last : ''}` : r.title_english}`).join('\n'))
				.addField(`For which ${msg.cmd} would you like to see the informations?`,
				'This prompt will be canceled on `cancel` or after `30` seconds.'));
		const collected = (await msg.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
		message.delete().catch(() => null);
		if (!collected) {
			throw new FriendlyError('cancel command.');
		} else if (collected.content === 'cancel') {
			msg.delete().catch(() => null);
			collected.delete().catch(() => null);
			return null;
		} else if (collected.content % 1 !== 0 || !response[parseInt(collected.content) - 1]) {
			collected.delete().catch(() => null);
			if (second) {
				msg.delete().catch(() => null);
				return null;
			}
			return this.select(msg, response, true);
		} else {
			collected.delete().catch(() => null);
			return response[parseInt(collected.content) - 1];
		}
	}

	async query(msg, aniSettings, args) {
		const res = await request.get(`https://anilist.co/api/${msg.cmd}/search/${args.search}?access_token=${aniSettings.token}`)
			.send(null).set('Content-Type', 'application/json');
		if (res.body.error) {
			if (res.body.error.messages[0] === 'No Results.') {
				return msg.embed(
					new Embed().setColor(0xffff00)
						.setDescription(`No ${msg.cmd} found.`)
						.setFooter(`${msg.author.username}: ${msg.content}`, msg.author.avatarURL));
			} else {
				this.client.emit('error', `[anime.js]: Error while fetching: ${res.body.error.messages[0]}`);
				throw new FriendlyError(stripIndent`There was an error while fetching the data from the server:
        ${res.body.error.messages[0]}`);
			}
		}
		return res.body;
	}

	send(response, msg) {
		if (!response) return;
		response.description = response.description === null ? 'No description' : response.description || response.info || 'No description';
		response.description = replaceMap(response.description, { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '`': '\'', '<br>': '\n', '<br />': '\n' });
		const embed = new Embed()
			.setColor(0x0800ff)
			.setThumbnail(response.image_url_lge);
		if (msg.cmd === 'character') {
			embed.setTitle(`${response.name_first ? response.name_first : ''} ${response.name_last ? response.name_last : ''}`)
				.setDescription(`${response.name_japanese}\n\n${response.name_alt ? `Aliases:\n${response.name_alt}` : ''}`);
		} else {
			embed.setTitle(response.title_japanese)
				.setDescription(response.title_romaji === response.title_english
					? response.title_english
					: `${response.title_romaji}\n${response.title_english}`)
				.addField('Genres', response.genres.join(', '), true)
				.addField('Rating | Typ', `${response.average_score} | ${response.type}`, true);
			if (msg.cmd === 'anime') embed.addField('Folgen', response.total_episodes, true);
			else embed.addField('Chapters | Volumes', `${response.total_chapters} | ${response.total_volumes}`, true);
			if (response.start_date_fuzzy) {
				let title = 'Start';
				let value = formatFuzzy(response.start_date_fuzzy);
				if ((response.airing_status && response.airing_status === 'finished airing') || (response.publishing_status && response.publishing_status === 'finished publishing')) {
					title = 'Period';
					value += ` - ${response.end_date_fuzzy ? formatFuzzy(response.end_date_fuzzy) : `Not specified`}`;
				}
				embed.addField(title, value, true);
			}
		}
		if (response.description.length < 1025) {
			embed.addField('Description', response.description);
		} else {
			const description = response.description.match(/(.|[\r\n]){1,1024}/g);
			for (let i = 0; i < description.length; i++) {
				embed.addField(i === 0 ? 'Description' : '\u200b',
					description[i]);
			}
		}
		if (msg.cmd === 'anime') {
			embed.addField('Airing Status:', response.airing_status, true)
				.addField('Herkunft', `${response.source}`.replace('null', 'Not specified'), true);
		} else if (msg.cmd === 'manga') {
			embed.addField('Publishing Status:', `${response.publishing_status}`.replace('null', 'Not specified'), true);
		}
		msg.embed(embed);
	}


};

