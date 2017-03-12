const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const GuildConfig = require(require('path').join(__dirname, '..', '..', 'dataProviders', 'models', 'GuildConfig'));

module.exports = class BlacklistCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'mute',
			group: 'modstuff',
			memberName: 'mute',
			description: 'Mutes or unmutes a member.',
			details: 'Mutes or unmutes the specified member, be careful with the fuzzy search.',
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

	hasPermission(msg) {
		const staffRoles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));
		return msg.member.roles.some(r => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const { id: guildID } = msg.guild;

		const config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;
		const mutedRole = msg.guild.roles.get(config.mutedRole);
		const { member: target } = args;

		if (!config.mutedRole) {
			msg.say('No muted role set up!');
			return;
		}
		if (!mutedRole) {
			msg.say('The set up role seems to be deleted, removing it from config then...');
			config.mutedRole = null;
			await GuildConfig.update(config, { where: { guildID } });
			return;
		}

		if (mutedRole.position > msg.guild.member(this.client.user).highestRole.position) {
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
		const staffRoles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));
		if (target.roles.some(r => staffRoles.includes(r.id)) || target.hasPermission('ADMINISTRATOR') || this.client.isOwner(target)) {
			msg.say('You can not mute that person!');
			return;
		}

		await target.addRole(mutedRole);
		msg.say(`Successfully muted \`${target.user.username}#${target.user.discriminator}\``);
	}

};

