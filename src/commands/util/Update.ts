import { exec } from 'child_process';
import { promisify } from 'util';
import { Message, Time } from 'yamdbf/bin';
import { desc, group, name, ownerOnly, usage } from 'yamdbf/bin/command/CommandDecorators';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';

const wait: (timeout: number) => Promise<void> = promisify(setTimeout) as any;

const execAsync: (command: string) => Promise<ExecResult> = promisify(exec) as any;

type ExecResult = {
	error?: ExecError,
	stdout: string,
	stderr: string,
};

type ExecError = {
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

		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';
		return statusMessage.edit(
			[
				`Successfully updated; Took: \`${diff}\`.`,
				'You may want to restart or reload commands manually if necessary.',
			])
			.then(() => undefined)
			.catch(() => null);
	}

	private async _pull(statusMessage: Message): Promise<boolean>
	{
		const startTime: number = Date.now();

		const { error, stdout, stderr }: ExecResult = await execAsync('git pull')
			.catch((err: ExecError) => ({
				error: err,
				stderr: err.stderr,
				stdout: err.stdout,
			}));

		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';
		let response: string = `\`Update\` Took: \`${diff}\`\n`;
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

		const { error, stdout, stderr }: ExecResult = await execAsync('npm run install')
			.catch((err: ExecError) => ({ error: err, stdout: err.stdout, stderr: err.stderr }));

		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';
		let response: string = `\`Install\` Took: \`${diff}\`\n`;
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
