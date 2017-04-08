import { stripIndents } from 'common-tags';
import { GuildMember, Message, Role } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { GuildConfig } from '../../dataProviders/models/GuildConfig';

export default class BlacklistCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'mute',
			group: 'moderation',
			memberName: 'mute',
			description: 'Mutes or unmutes a member.',
			details: stripIndents`Mutes or unmutes the specified member, be careful with the fuzzy search, it might mute or unmute the wrong member.
			Mentions or IDs are the best way to ensure you mute or unmute the correct member.`,
			examples: [
				'`mute @owo` Mutes or unmutes the member owo',
				'`mute 250381145462538242` Mutes or unmutes the member with that ID.',
				'`mute owo` Search for a member called owo and mutes or unmutes them',
				'Be careful with the last option, you might mute or unmute someone you are not intdending to.'
			],
			guildOnly: true,
			args: [
				{
					key: 'member',
					prompt: 'which Member do you like to mute or unmute?\n',
					type: 'member'
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []));
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { member: GuildMember }): Promise<Message | Message[]> {
		const config: GuildConfig = (await GuildConfig.findOrCreate({ where: { guildID: msg.guild.id } }) as any)[0].dataValues;
		const mutedRole: Role = msg.guild.roles.get(config.mutedRole);
		const { member: target } = args;

		if (!config.mutedRole) {
			msg.say('No muted role set up!');
			return;
		}

		if (!mutedRole) {
			msg.say('The set up role seems to be deleted, removing it from config then...');
			config.mutedRole = null;
			await GuildConfig.upsert(config);
			return;
		}

		if (mutedRole.position >= msg.guild.member(this.client.user).highestRole.position) {
			msg.say(stripIndents`I can not mute or unmute someone while  \`@${mutedRole.name}\` is higher than my highest role.
      		You should change that, or yell at someone who can.`);
			return;
		}

		if (target.roles.has(mutedRole.id)) {
			target.removeRole(mutedRole);
			msg.say(`Successfully unmuted \`${target.user.username}#${target.user.discriminator}\`!`);
			return;
		}

		if (target.id === msg.author.id) {
			msg.say(stripIndents`Muting yourself, what a wonderful idea!
      		Wait... actually not.`);
			return;
		}

		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []));
		if (target.roles.some((r: Role) => staffRoles.includes(r.id)) || target.hasPermission('ADMINISTRATOR') || this.client.isOwner(target)) {
			msg.say('You can not mute that person!');
			return;
		}

		await target.addRole(mutedRole);
		return msg.say(`Successfully muted \`${target.user.username}#${target.user.discriminator}\``);
	}

};
