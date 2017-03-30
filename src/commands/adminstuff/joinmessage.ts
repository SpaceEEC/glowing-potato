import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { join } from 'path';
import { Model } from 'sequelize';
import { GuildConfig } from '../../dataProviders/models/GuildConfig';
import { getUsedAlias } from '../../util/util';

export default class JoinMessageCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'joinmessage',
			aliases: ['joinmsg'],
			group: 'adminstuff',
			memberName: 'joinmessage',
			description: 'Sets or removes the join message for this guild.',
			details: stripIndents`You can use :guild: as placeholder for the guildname,
      and :member: as placeholder for the joined member, this won't ping them, see the examples down there.`,
			examples: [
				stripIndents`\`joinmessage Welcome to :guild:, :member:!\`
        Will look like:
        Welcome to Discordinios, \`@space#0302\`!\n\u200b`,
				stripIndents`\`joinmessage remove\`
        Will disable that message.\n\u200b`],
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

	public async run(msg: CommandMessage, args: { message: string }): Promise<Message | Message[]> {
		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID: msg.guild.id } }) as any)[0].dataValues;
		if (args.message === 'show') {
			msg.say(config.joinMessage || 'No message set.');
			return;
		}

		config.joinMessage = args.message === 'remove' ? null : args.message;

		await GuildConfig.upsert(config);

		return msg.say(stripIndents`The join message is now ${`\`${config.joinMessage || 'disabled'}\``}!
		${config.anChannel || config.logChannel ? '' : 'Info: No channel to announce or log set up!'}`);
	}
};
