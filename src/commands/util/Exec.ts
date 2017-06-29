import { exec } from 'child_process';
import { promisify } from 'util';
import { Command, Message } from 'yamdbf/bin';
import { desc, group, name, ownerOnly, usage } from 'yamdbf/bin/command/CommandDecorators';

import { Client } from '../../structures/Client';
import { ReportError } from '../../structures/ReportError';

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
	public constructor(client: Client) { super(); }

	@ReportError
	public async action(message: Message, code: string[]): Promise<void>
	{
		const { error, stdout, stderr }: { error?: any, stdout?: string, stderr?: string } = await execAsync(code.join(' '))
			.catch((err: any) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));

		const response: string = '`EXEC` '
			+ (error && error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
			+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
			+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '');

		return message.channel.send(response).then(() => undefined);
	}
}
