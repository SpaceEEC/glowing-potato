import { exec } from 'child_process';
import { promisify } from 'util';
import { Message } from 'yamdbf/bin';
import { desc, group, name, ownerOnly, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const execAsync: (command: string) => Promise<{
	stdout?: string,
	stderr?: string,
}> = promisify(exec) as any;

@desc('Executes input in the command line. Usually powershell or bash.')
@name('exec')
@group('util')
@ownerOnly
@usage('<prefix>exec <...code>')
export default class ExecCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, code: string[]): Promise<void>
	{
		const { error, stdout, stderr }: { error?: any, stdout?: string, stderr?: string } = await execAsync(code.join(' '))
			.catch((err: any) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));

		let response: string = '`EXEC` '
			+ (error && error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
			+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
			+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '');

		// might be replaced with a hastebing or something similar in the future
		if (response.length > 2000)
		{
			response = `${response.slice(0, 1997)}...`;
		}

		return message.channel.send(response).then(() => undefined);
	}
}
