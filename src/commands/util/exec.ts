import { exec } from 'child_process';
import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

type Execution = {
	/** Full error typings are overrated */
	error: any;
	stdout: string;
	stderr: string;
};

export default class ExecuteCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['doshit'],
			args: [
				{
					key: 'code',
					prompt: 'what shall be executed?\n',
					type: 'string',
				},
			],
			description: 'Executes commands in bash.',
			group: 'util',
			guarded: true,
			memberName: 'exec',
			name: 'exec',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { code: string }): Promise<Message | Message[]> {
		const statusMessage: Message = await msg.say('Executing...') as Message;

		const { error, stdout, stderr }: Execution = await new Promise<Execution>(
			(resolve: (value: Execution) => void) => {
				// tslint:disable-next-line:no-shadowed-variable
				exec(args.code, (error: any, stdout: string, stderr: string) =>
					resolve({ error, stdout, stderr }));
			});
		if (error) {
			return statusMessage.edit(stripIndents`
				\`EXEC\` ${error.code ? `\`Error Code: ${error.code}\`` : ''}\n
				\`\`\`xl\n${args.code}\n\`\`\`
				${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
				${error.stack ? `\`E-ROHR\`\n\`\`\`js\n${error.stack}\n\`\`\`` : ''}
				${error.signal ? `Signal received: ${error.signal}` : ''}`);
		} else {
			return statusMessage.edit(stripIndents`
				\`EXEC\`
				\`\`\`xl\n${args.code}\n\`\`\`
				${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
				${stderr ? `\`STERR\`\n\`\`\`xl\n${stderr}\`\`\`` : ''}`);
		}
	}
}
