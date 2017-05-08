import { stripIndents } from 'common-tags';
import { Emoji, GuildChannel, Message, RichEmbed } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
moment.locale('de');

export default class ServerinfoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'server-info',
			aliases: ['guild-info'],
			group: 'info',
			memberName: 'server-info',
			description: 'General information about this guild.',
			guildOnly: true,
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed(new RichEmbed()
			.setColor(0xffa500).setTitle('Information about this guild.')
			.setThumbnail(msg.guild.iconURL)
			.addField('❯ Channel:', stripIndents`
      • \`${msg.guild.channels.filter((c: GuildChannel) => c.type === 'text').size}\` Textchannel
      • \`${msg.guild.channels.filter((c: GuildChannel) => c.type === 'voice').size}\` Voicechannel`, true)
			.addField('❯ Member:', `• \`${msg.guild.memberCount}\` Member\n• Owner is ${msg.guild.owner}`, true)
			.addField('❯ General:', stripIndents`
      • \`${msg.guild.roles.size}\` Roles
      • In ${this._capitalize(msg.guild.region)}`, true)
			.addField('\u200b', `• Created ${moment(msg.guild.createdAt).format('DD.MM.YYYY [\n   at:] hh:mm:ss')}`, true)
			.addField('❯ Emojis:', this._getRandomEmojis(msg))
			.setFooter(msg.cleanContent, msg.author.displayAvatarURL)
		);
	}

	private _capitalize(name: string): string {
		return name[0].toUpperCase() + name.slice(1);
	}

	private _getRandomEmojis(msg: CommandMessage): string {
		const emojis: string[] = msg.guild.emojis.map((e: Emoji) => e.toString());
		for (let i: number = emojis.length - 1; i > 0; i--) {
			const randomIndex: number = Math.floor(Math.random() * (i + 1));
			const temp: string = emojis[i];
			emojis[i] = emojis[randomIndex];
			emojis[randomIndex] = temp;
		}
		let response: string = '';
		for (const emoji of emojis) {
			if ((response.length + emoji.length) > 1021) {
				response += '...';
				break;
			} else { response += ` ${emoji}`; }
		}
		return response;
	}
};
