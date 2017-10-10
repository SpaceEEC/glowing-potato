import { Attachment } from 'discord.js';
import { CommandDecorators, Message, Time } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { Util } from '../../util/Util';

const { desc, group, name, ownerOnly, usage } = CommandDecorators;

@desc('Executes input in the command line. Usually powershell or bash.')
@name('exec')
@group('util')
@ownerOnly
@usage('<prefix>exec <...code>')
export default class ExecCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, code: string[]): Promise<CommandResult>
	{
		const statusMessage: Message = await message.channel.send('Executing...') as Message;

		const startTime: number = Date.now();
		const { error, stdout, stderr }: { error?: any, stdout?: string, stderr?: string } = await Util
			.execAsync(code.join(' ')).catch((err: any) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));
		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';

		const response: string = `\`EXEC\` \`Took: ${diff}\`\n\n`
			+ (error && error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
			+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
			+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '');

		if (response.length <= 2000)
		{
			return statusMessage.edit(response)
				.then(() => undefined);
		}

		statusMessage.edit('Executed. Output is too long, will be sent as file instead.')
			.catch(() => null);

		return new Attachment(Buffer.from(response), 'output.txt');
	}
}
