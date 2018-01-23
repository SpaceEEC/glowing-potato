import { RichEmbed, Util as DJSUtil, version as DJSVersion } from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';
import { CommandDecorators, Message, ResourceLoader, version as YAMDBFVersion } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Util } from '../../util/Util';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage, localizable } = CommandDecorators;

const { version }: { version: string } = require('../../../package.json');

@aliases('stats')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays generic information about the bot')
@name('info')
@group('info')
@guildOnly
@usage('<prefix>info')
export default class InfoCommand extends Command<Client>
{
	@localizable
	@ReportError
	public async action(message: Message, [res]: [ResourceLoader]): Promise<CommandResult>
	{
		const owners: string = this.client.owner.map((owner: string) => `\`${this.client.users.get(owner).tag}\``).join(', ');
		const uptime: string = (moment.duration(this.client.uptime) as any).format(res(S.CMD_INFO_UPTIME_FORMAT_STRING));

		const embed: RichEmbed = new RichEmbed()
			.setColor(0xffa500)
			.setTitle(res(S.CMD_INFO_TITLE))
			.addField(res(S.CMD_INFO_UPTIME_TITLE),
			`• ${uptime}`,
			false)
			.addField(res(S.CMD_INFO_VERSIONS),
			[
				'• __**[discord.js](https://github.com/hydrabolt/discord.js)**__',
				`  Version: v${DJSVersion}`,
				'',
				'• __**[YAMDBF](https://github.com/zajrik/yamdbf)**__',
				`  Version: v${YAMDBFVersion}`,
			],
			true)
			.addField('\u200b',
			[
				'• __**[glowing-potato](https://github.com/SpaceEEC/glowing-potato)**__',
				` Version: v${version}`,
			],
			true)
			.addField(res(S.CMD_INFO_UPTIME_MEMORY_USAGE_TITLE),
			`• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, true)
			.addField(res(S.CMD_INFO_OWNER_TITLE),
			`• ${owners}`, true);

		if (this.client.voiceConnections.size)
		{
			embed.addField(res(S.CMD_INFO_VOICE_CONNECTIONS_TITLE), this.client.voiceConnections.size, false);
		}

		embed.addField(res(S.CMD_INFO_RECENT_CHANGES), await this._formatCommits())
			.setTimestamp()
			.setThumbnail(this.client.user.displayAvatarURL)
			.setFooter(message.cleanContent, message.author.displayAvatarURL);

		return embed;
	}

	private async _formatCommits(): Promise<string>
	{
		// TODO: Get moment to stop complaining
		const { stdout }: { stdout: string } = await Util.execAsync(
			'git log --pretty=format:"%h,%an,%ad,%s" --date=iso8601 | head -n 5',
			{ encoding: 'utf8' },
		);

		const commits: string[] = [];
		for (const commit of stdout.split('\n').slice(0, -1))
		{
			const [hash, , date, ...message] = commit.split(',');
			commits.push(
				[
					`• [${hash}](https://github.com/SpaceEEC/glowing-potato/commit/${hash})`,
					` - ${moment(date).fromNow()}:\n`,
					`\`${DJSUtil.escapeMarkdown(message.join(','), undefined, true)}\``,
				].join(''),
			);
		}

		return commits.join('\n');
	}
}
