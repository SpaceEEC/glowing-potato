import { stripIndents } from 'common-tags';
import { Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { GuildConfig } from '../../dataProviders/models/GuildConfig';

export default class JoinMessageCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['joinmsg'],
			args: [
				{
					default: 'show',
					key: 'message',
					max: 1800,
					prompt: stripIndents`
						what shall the join message be?
						Respond with \`remove\` to disable the join message.\n`,
					type: 'string',
				},
			],
			description: 'Join message configuration.',
			details: stripIndents`
				Sets, removes or shows the join message for this guild.
				You can use :guild: as placeholder for the guildname,
				and :member: as placeholder for the joined member, this won't ping them, see the examples down there.`,
			examples: [
				stripIndents`
					\`joinmessage Welcome to :guild:, :member:!\`
					Will look like:
					Welcome to Discordinios, \`@space#0302\`!\n\u200b`,
				stripIndents`
					\`joinmessage remove\`
					Will disable that message.\n\u200b`],
			group: 'administration',
			guildOnly: true,
			memberName: 'joinmessage',
			name: 'joinmessage',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []);
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id))
			|| msg.member.hasPermission('ADMINISTRATOR')
			|| this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { message: string }): Promise<Message | Message[]> {
		const config: GuildConfig = await GuildConfig.findOrCreate({ where: { guildID: msg.guild.id } });

		if (args.message === 'show') {
			return msg.say(config.joinMessage || 'No message set.');
		}

		config.joinMessage = args.message === 'remove' ? null : args.message;

		await config.save();

		return msg.say(stripIndents`
			The join message is now ${`\`${config.joinMessage || 'disabled'}\``}!
			${config.anChannel || config.logChannel ? '' : 'Info: No channel to announce or log set up!'}`,
		);
	}
}
