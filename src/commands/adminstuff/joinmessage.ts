import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { join } from 'path';
import { Model } from 'sequelize';
import { GuildConfig } from '../../dataProviders/models/GuildConfig';
import { getUsedAlias } from '../../util/util';

export default class LogchannelCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'joinmessage',
			aliases: ['joinmsg', 'leavemessage', 'leavemsg'],
			group: 'adminstuff',
			memberName: 'joinmessage',
			description: 'Sets or removes the join or leave message for this guild.\nTo set or remove the leave message use the alias.',
			details: stripIndents`You can use :guild: as placeholder for the guildname,
      and :member: as placeholder for the joined member, this won't ping him/her, see the examples down there.`,
			examples: [
				stripIndents`\`joinmessage Welcome to :guild:, :member:!\`
        Will look like:
        Welcome to Discordinios, \`@space#0302\`!\n\u200b`,
				stripIndents`\`joinmessage remove\`
        Will disable that message.\n\u200b`,
				'Same usage for `leavemessage`.'],
			guildOnly: true,
			args: [
				{
					key: 'message',
					prompt: stripIndents`what shall that message be?
          Respond with \`remove\` to disable that message.\n`,
					type: 'string',
					max: 1800,
					default: 'show',
				},
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { message: string, cmd: string }): Promise<Message | Message[]> {
		const { id: guildID } = msg.guild;
		args.cmd = getUsedAlias(msg, { joinmessage: 'joinMessage', joinmsg: 'joinMessage', leavemessage: 'leaveMessage', leavemsg: 'leaveMessage' });

		// satisfy tslint
		if (args.cmd !== 'joinMessage' && args.cmd !== 'leaveMessage') return null;

		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID } }) as any)[0].dataValues;
		if (args.message === 'show') {
			msg.say(config[args.cmd] || 'No message set.');
			return;
		}

		config[args.cmd] = args.message === 'remove' ? null : args.message;

		await GuildConfig.upsert(config);

		return msg.say(stripIndents`The ${args.cmd} is now ${`\`${config[args.cmd] || 'disabled'}\``}!
		${config.anChannel || config.logChannel ? '' : 'Info: No channel to announce or log set up!'}`);
	}
};
