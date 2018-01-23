import { Attachment } from 'discord.js';
import { CommandDecorators, Message, Time } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';
import { ExecError } from '../../types/ExecError';
import { Util } from '../../util/Util';

const { desc, group, name, ownerOnly, usage } = CommandDecorators;

type ExecResult = {
	error?: ExecError,
	stdout: string,
	stderr: string,
};

@desc('Updates the bot\'s files.')
@name('update')
@group('util')
@ownerOnly
@usage('<prefix>update [\'reinstall\']')
export default class UpdateCommand extends Command<Client>
{
	@ReportError
	public async action(message: Message, [reinstall]: string[]): Promise<CommandResult>
	{
		const startTime: number = Date.now();
		let statusMessage: Message = await message.channel.send('**Pulling new files...**') as Message;

		if (!await this._pull(statusMessage)) return;

		await Util.wait(2000);

		statusMessage = await message.channel.send('**Installing new files...**') as Message;

		if (!await this._install(statusMessage, reinstall === 'reinstall')) return;

		await Util.wait(2000);

		const diff: string = Time.difference(Date.now(), startTime).toSimplifiedString() || '0s';
		return message.channel.send(
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

		const { error, stdout, stderr }: ExecResult = await Util.execAsync('git pull')
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

		if (response.length <= 2000)
		{
			await statusMessage.edit(response);
		}
		else
		{
			await Promise.all(
				[
					statusMessage.edit('Output too long, will be sent as file instead.'),
					statusMessage.channel.send(new Attachment(Buffer.from(response), 'install.txt')),
				],
			);
		}

		if (stdout.startsWith('Already up-to-date.')) return false;

		return true;
	}

	private async _install(statusMessage: Message, reinstall: boolean): Promise<boolean>
	{
		const startTime: number = Date.now();

		if (reinstall) await Util.execAsync('rm -rf ./node_modules');

		const { error, stdout, stderr }: ExecResult = await Util.execAsync(reinstall ? 'npm install' : 'npm run install')
			.catch((err: ExecError) => ({
				error: err,
				stderr: err.stderr,
				stdout: err.stdout,
			}));

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

		if (response.length <= 2000)
		{
			await statusMessage.edit(response);
		}
		else
		{
			await Promise.all(
				[
					statusMessage.edit('Output too long, will be sent as file instead.'),
					statusMessage.channel.send(new Attachment(Buffer.from(response), 'install.txt')),
				],
			);
		}

		return true;
	}
}
