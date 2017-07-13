import { exec } from 'child_process';
import { promisify } from 'util';
import { Message, Time } from 'yamdbf/bin';
import { desc, group, name, ownerOnly, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const wait: (timeout: number) => Promise<void> = promisify(setTimeout) as any;

const execAsync: (command: string) => Promise<execResult> = promisify(exec) as any;

type execResult = {
	error?: execError,
	stdout: string,
	stderr: string,
};

type execError = {
	code: number,
	cmd: string,
	killed: boolean,
	signal: any,
	stderr: string,
	stdout: string,
} & Error;

@desc('Updates the bot\'s files.')
@name('update')
@group('util')
@ownerOnly
@usage('<prefix>update')
export default class UpdateCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, args: string[]): Promise<void>
	{
		const startTime: number = Date.now();
		const statusMessage: Message = await message.channel.send('**Pulling new files...**') as Message;

		if (!await this._pull(statusMessage)) return;

		await wait(2000);

		await statusMessage.edit('**Installing new files...**');

		if (!await this._install(statusMessage)) return;

		await wait(2000);

		return statusMessage.edit(
			[
				`Successfully updated; Took: \`${Time.difference(Date.now(), startTime).toSimplifiedString()}\``,
				'You may want to restart or reload commands manually if necessary.',
			])
			.then(() => undefined)
			.catch(() => null);
	}

	private async _pull(statusMessage: Message): Promise<boolean>
	{
		const startTime: number = Date.now();

		const { error, stdout, stderr }: execResult = await execAsync('git pull')
			.catch((err: execError) => ({
				error: err,
				stderr: err.stderr,
				stdout: err.stdout,
			}));

		let response: string = `\`Update\` Took: \`${Time.difference(Date.now(), startTime).toSimplifiedString()}\`\n`;
		if (error)
		{
			response += (error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
				+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
				+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '')
				+ '\n Canceling further steps duo error.';

			return statusMessage.edit(response)
				.then(() => false)
				.catch(() => false);
		}
		response += `\`\`\`xl\n${stdout}\n\n${stderr}\`\`\``;

		await statusMessage.edit(response);

		if (stdout.startsWith('Already up-to-date.')) return false;

		return true;
	}

	private async _install(statusMessage: Message): Promise<boolean>
	{
		const startTime: number = Date.now();

		const { error, stdout, stderr }: execResult = await execAsync('npm run install')
			.catch((err: execError) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));

		let response: string = `\`Install\` Took: \`${Time.difference(Date.now(), startTime).toSimplifiedString()}\`\n`;
		if (error)
		{
			response += (error.code ? `\`Error Code: ${error.code}\`\n\n` : '')
				+ (stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`\n\n` : '')
				+ (stderr ? `\`STDERR\`\n\`\`\`xl\n${stderr}\`\`\`\n\n` : '')
				+ '\n Canceling further steps duo error.';

			return statusMessage.edit(response)
				.then(() => false)
				.catch(() => false);
		}
		response += `\`\`\`xl\n${stdout}\n\n${stderr}\`\`\``;

		await statusMessage.edit(response);

		return true;
	}
}
