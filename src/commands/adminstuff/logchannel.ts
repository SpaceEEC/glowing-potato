import { stripIndents } from 'common-tags';
import { Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { join } from 'path';
import { GuildConfig } from '../../dataProviders/models/Guildconfig';
import { getUsedAlias } from '../../util/util';

export default class LogchannelCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'logchannel',
			aliases: ['vlogchannel', 'anchannel'],
			group: 'adminstuff',
			memberName: 'logchannel',
			description: 'Enables or disables logging of different types for this guild.',
			details: stripIndents`There is either vlogchannel, anchannel or logchannel as the type, use the aliases to set these.
      To remove a channel, specify just specify that channel.
      Mention the same channel again to remove it.
      Omit the channel parameter to show the current channel.`,
			examples: [
				'`vlogchannel #logs`',
				'`anchannel #logs`',
				'`logchannel #logs`',
			],
			guildOnly: true,
			args: [
				{
					key: 'channel',
					prompt: 'wich channel do you like to set up or remove?\n',
					type: 'channel',
					default: 'show'
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const adminRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { channel: TextChannel | String, cmd: string }): Promise<Message | Message[]> {
		const { id: guildID } = msg.guild;
		args.cmd = getUsedAlias(msg, { vlogchannel: 'vlogChannel', anchannel: 'anChannel', logchannel: 'logChannel' });

		// satisfy tslint
		if (args.cmd !== 'anChannel' && args.cmd !== 'logChannel' && args.cmd !== 'vlogChannel') return null;

		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID } }) as any)[0].dataValues;

		if (args.channel === 'show') {
			msg.say(config[args.cmd] || `No ${args.cmd} set.`);
			return;
		}

		config[args.cmd] = args.channel === config[args.cmd] ? null : (args.channel as TextChannel).id;

		await GuildConfig.upsert(config);

		msg.say(`The ${args.cmd} is now ${args.channel || 'disabled'}!`);
	}
};
