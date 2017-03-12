const { Command } = require('discord.js-commando');
const { exec } = require('child_process');
const { stripIndents } = require('common-tags')

module.exports = class UpdateCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'update',
			group: 'util',
			memberName: 'update',
			description: 'Pulls the newest version from git.',
			guildOnly: true,
			guarded: true,
			args: [
				{
					key: 'restart',
					prompt: 'do you like to restart?\n',
					type: 'boolean',
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const statusMessage = await msg.say('Starte Update...');
		exec('git pull', async (error, stdout, stderr) => {
			if (error) {
				statusMessage.edit(stripIndents`
					\`INFO\`\n\`\`\`xl\n${stdout}\n\n${stderr}\`\`\`
					${error.code ? `Exit Code: ${error.code}` : ''}
					${error.signal ? `Signal erhalten: ${error.signal}` : ''}
					There were errors during the pull.
					${args.restart ? 'Not restarting.' : ''}`);
			} else {
				await statusMessage.edit(stripIndents`
					${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
					${args.restart ? 'Automatically restarting...' : 'Not restarting.'}`);
				if (args.restart) process.exit(1335);
			}
		});
	}

};
