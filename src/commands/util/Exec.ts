import { CommandDecorators, Message, Time } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
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
	public async action(message: Message, code: string[]): Promise<void>
	{
		const statusMessage: Message = await message.channel.send('Executing...') as Message;

		const startTime: number = Date.now();
		const { error, stdout, stderr }: { error?: any, stdout?: string, stderr?: string } = await Util
			.execAsync(code.join(' ')).catch((err: any) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));
		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';

		let response: string = `\`EXEC\` \`Took: ${diff}\`\n\n`
			+ (error && error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
			+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
			+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '');

		// might be replaced with a hastebin or something similar in the future
		if (response.length > 2000)
		{
			response = `${response.slice(0, 1994)}\`\`\`...`;
		}

		return statusMessage.edit(response).then(() => undefined);
	}
}
