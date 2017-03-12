const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class ConfigCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'musicchannel',
			aliases: ['djchannel', 'djchannels', 'mchannel', 'mchannels', 'musicchannels'],
			group: 'adminstuff',
			memberName: 'musicchannel',
			description: 'Adds or removes a musicchannel.',
			details: stripIndents`
      To add or remove a music channel, simply specify it, either with a mention, name or ID.
      If no channel is present, the commands are allowed everywhere.
      To remove a channel, specify an already linked one, it will be removed then.`,
			examples: [
				'`mchannel #music-commands` Adds or removes the `#music.commands` channel from the music channels',
				'`mchannel` Displays all music channels.'
			],
			guildOnly: true,
			args: [
				{
					key: 'channel',
					prompt: 'which channel do you like to add or remove?\n',
					type: 'channel',
					default: 'show',
				}
			]
		});
	}

	hasPermission(msg) {
		const adminRoles = msg.guild.settings.get('adminRoles', []);
		return msg.member.roles.some(r => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const channels = msg.guild.settings.get('djChannel', []);

		if (args.channel === 'show') {
			msg.say(channels.length ? channels.map(r => `<#${r}>`).join(', ') : 'No channel set, so everywhere.');
			return;
		}

		if (channels.includes(args.channel.id)) {
			channels.splice(channels.indexOf(args.channel.id), 1);
		} else {
			args.added = true;
			channels.push(args.channel.id);
		}

		msg.guild.settings.set('djChannel', channels);

		msg.say(stripIndents`${args.channel} ${args.added ? `has been added to` : 'has been removed from'} the music channels!
    ${channels.length ? `Current channels: ${channels.map(r => `<#${r} > `).join(', ')}` : 'No channel set, so everywhere.'}`);
	}
};
