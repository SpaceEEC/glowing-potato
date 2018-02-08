import * as Discord from 'discord.js';
import { inspect, InspectOptions } from 'util';
import { CommandDecorators, Message, ResourceLoader } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { LocalizationStrings as S } from '../../localization/LocalizationStrings';
import { Client } from '../../structures/Client';
import { Command, CommandResult } from '../../structures/Command';

const { desc, group, name, ownerOnly, usage, localizable } = CommandDecorators;

@desc('Evaluates provided JavaScript code.')
@name('eval')
@group('base')
@ownerOnly
@usage('<prefix>eval <...code>')
export default class EvalCommand extends Command<Client>
{
	/**
	 * Inspect options used when inspecting outputs and errors
	 * @private
	 */
	private _inspect: InspectOptions = { depth: 1 };

	@ReportError
	@localizable
	public async action(message: Message, [res, ...args]: [ResourceLoader, string[]]): Promise<CommandResult>
	{
		const client: Client = this.client;
		const msg: Message = message;

		if (!args.length) return res(S.CMD_EVAL_ERR_NOCODE);

		const code: string = args.join(' ');

		const startTime: [number, number] = process.hrtime();

		try
		{
			// tslint:disable-next-line:no-eval
			let result: any = await eval(
				code.includes('await')
					? `(async()=>{${code}})()`
					: code,
			);

			const diff: [number, number] = process.hrtime(startTime);
			const diffString: string = diff[0] > 0 ? `\`${diff[0]}\`s` : `\`${diff[1] / 1e6}\`ms`;

			const typeofEvaled: string = result === null
				? 'null'
				: result
					&& result.constructor
					? result.constructor.name
					: typeof result;

			if (typeof result !== 'string')
			{
				result = inspect(result, this._inspect);
			}

			if (result.includes(client.token))
			{
				result = result.replace(/[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g, '[REDACTED]');
			}

			result = [
				'**Result**',
				'```js',
				Discord.Util.escapeMarkdown(result, true),
				'```',
				`Type: \`${typeofEvaled}\` | Took: ${diffString}`,
			].join('\n');

			if (result.length <= 2000)
			{
				return result;
			}

			return msg.channel.send('Output is too long, will be sent as file instead.',
				new Discord.Attachment(Buffer.from(result), 'output.txt'));
		}
		catch (error)
		{
			const diff: [number, number] = process.hrtime(startTime);
			const diffString: string = diff[0] > 0 ? `\`${diff[0]}\`s` : `\`${diff[1] / 1e6}\`ms`;

			const typeofError: string = error === null
				? 'null'
				: error
					&& error.constructor
					? error.constructor.name
					: typeof error;

			error = error instanceof Error
				? error.message || String(error)
				: inspect(error, this._inspect);

			const result: string = [
				'**Error**',
				'```js',
				Discord.Util.escapeMarkdown(error, true),
				'```',
				`Type: \`${typeofError}\` | Took: ${diffString}`,
			].join('\n');

			if (result.length <= 2000)
			{
				return result;
			}

			return msg.channel.send('Error is too long, will be sent as file instead.',
				new Discord.Attachment(Buffer.from(result), 'error.txt'));
		}
	}

	protected get depth(): number
	{
		return this._inspect.depth;
	}
	protected set depth(value: number)
	{
		this._inspect.depth = value;
	}
}
