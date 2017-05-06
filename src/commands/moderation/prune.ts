import { stripIndents } from 'common-tags';
import { Collection, GuildChannel, GuildMember, Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class PruneCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'prune',
			aliases: ['purge', 'clean', 'clear'],
			group: 'moderation',
			memberName: 'prune',
			description: 'Deletes messages.',
			details: stripIndents`Let's you delete multiple messages at once.
      		You can delete any amount between \`2\` and \`100\`.
      		You can Mention, ID or Name a member to filter, so it will delete only their messages.`,
			examples: [
				'`prune 100 @spacebot` Will delete all messages from spacebot in the last 100 messages.',
				'`prune 100 242685080693243906` Will delete all messages from the member with that ID in the last 100 messages.',
				'`prune 100 spacebot` Will search for a member with that name and delete all messages from that member in the last 100 messages.',
				'`prune 100` Will delete the last 100 messages.'
			],
			guildOnly: true,
			args: [
				{
					key: 'amount',
					prompt: 'how much messages do you wish to delete?\n',
					type: 'integer',
					min: 2,
					max: 100
				},
				{
					key: 'member',
					prompt: 'whose messages do you wish to delete?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []));
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { amount: number, member: GuildMember }): Promise<Message | Message[]> {
		if (!(msg.channel as GuildChannel).permissionsFor(await msg.guild.fetchMember(this.client.user)).hasPermission('MANAGE_MESSAGES')) {
			return msg.say('I do not have permissions to delete messages here, so no deleting.');
		}
		let messages: Collection<string, Message> = await msg.channel.fetchMessages({ limit: args.amount });
		if (args.member) messages = messages.filter((m: Message) => m.author.id === args.member.id);
		if (!messages.size) return undefined;
		if (messages.size === 1) return messages.first().delete();
		else await msg.channel.bulkDelete(messages, true);
	}
};
