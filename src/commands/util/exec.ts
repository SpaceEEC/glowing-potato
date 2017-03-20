import { exec } from 'child_process';
import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class ExecuteCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'exec',
			aliases: ['doshit'],
			group: 'util',
			memberName: 'exec',
			description: 'Executes commands in bash.',
			guildOnly: true,
			guarded: true,
			args: [
				{
					key: 'code',
					prompt: 'what shall be executed?\n',
					type: 'string'
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { code: string }): Promise<Message | Message[]> {
		const statusMessage: Message | Message[] = await msg.say('Executing...');
		exec(args.code, (error: any, stdout: string, stderr: string) => {
			if (error) {
				(statusMessage as Message).edit(
					stripIndents`\`EXEC\` ${error.code ? `\`Error Code: ${error.code}\`` : ''}\n
					\`\`\`xl\n${args.code}\n\`\`\`
          			${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
					${error.stack ? `\`E-ROHR\`\n\`\`\`js\n${error.stack}\n\`\`\`` : ''}
					${error.signal ? `Signal received: ${error.signal}` : ''}`);
			} else {
				(statusMessage as Message).edit(
					stripIndents`
					\`EXEC\`
					\`\`\`xl\n${args.code}\n\`\`\`
         			${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
					${stderr ? `\`STERR\`\n\`\`\`xl\n${stderr}\`\`\`` : ''}`);
			}
		});
		return statusMessage;
	}

};
