const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class PruneCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'prune',
			aliases: ['purge', 'clean'],
			group: 'modstuff',
			memberName: 'prune',
			description: 'Deletes messages.',
			details: stripIndents`Let's you bulk delete messages.
      You can delete any amount between \`2\` and \`100\`.
      You can Mention, ID or Name a member to filter, so it will delete only whose messages.`,
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

	hasPermission(msg) {
		const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));
		return msg.member.roles.some(r => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		if (!msg.channel.permissionsFor(await msg.guild.fetchMember(this.client.user)).hasPermission('MANAGE_MESSAGES')) {
			return msg.say('I do not have permissions to delete messages here.');
		}
		let messages = await msg.channel.fetchMessages({ limit: args.amount });
		if (args.member) messages = messages.filter(m => m.author.id === args.member.id);
		if (!messages.size) return null;
		await msg.channel.bulkDelete(messages);
		return null;
	}
};
