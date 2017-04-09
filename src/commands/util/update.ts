/*import { exec } from 'child_process';
import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class UpdateCommand extends Command {
	constructor(client: CommandoClient) {
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

	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { restart: string }): Promise<Message | Message[]> {
		const statusMessage: Message | Message[] = await msg.say('Starte Update...');
		exec('git pull', async (error: any, stdout: string, stderr: string) => {
			if (error) {
				(statusMessage as Message).edit(stripIndents`
					\`INFO\`\n\`\`\`xl\n${stdout}\n\n${stderr}\`\`\`
					${error.code ? `Exit Code: ${error.code}` : ''}
					${error.signal ? `Signal erhalten: ${error.signal}` : ''}
					There were errors during the pull.
					${args.restart ? 'Not restarting.' : ''}`);
			} else {
				await (statusMessage as Message).edit(stripIndents`
					${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
					${args.restart ? 'Automatically restarting...' : 'Not restarting.'}`);
				if (args.restart) process.exit(1335);
			}
		});
		return statusMessage;
	}

};
*/
