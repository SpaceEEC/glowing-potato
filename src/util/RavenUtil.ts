import { GuildChannel, Message } from 'discord.js';
import { CaptureOptions, Client as Raven } from 'raven';
import { inspect, promisify } from 'util';
import { LogData, Logger, LogLevel } from 'yamdbf';

const { version }: { version: string } = require('../../package.json');

/**
 * Static RavenUtil class which holds promisified method wrappers for Raven.
 * @static
 */
export class RavenUtil
{
	/**
	 * Initiates the static RavenUtil class.
	 * @returns {void}
	 * @static
	 */
	public static init(): void
	{
		Logger.instance().addTransport({
			level: LogLevel.WARN,
			transport: ({ type, tag, text }: LogData) =>
			{
				// only sent to raven on non-dev
				if (Number(process.env.LOGLEVEL) === LogLevel.DEBUG) return;

				if (!['WARN', 'ERROR'].includes(type)) return;

				// ignore raven log messages
				if (tag === 'Raven') return;

				RavenUtil._captureMessage(text, { level: type === 'WARN' ? 'warning' : 'error', tags: { label: tag } })
					.then((eventId: string) => Logger.instance().info('Raven', `Logged warn; eventId: ${eventId}`))
					.catch((error: Error) =>
					{
						Logger.instance().error(
							'Raven',
							'An error occured while logging the error:',
							inspect(error, true, Infinity, true),
						);
					},
				);
			},
		});
	}

	/**
	 * Logs an exception to sentry and relays the error also to the built-in logger.
	 * @param {string} label Label for the logger
	 * @param {Error} error Error to log
	 * @param {...string} rest Additional strings, first entry can be a message object.
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async error(label: string, error: Error, message: Message, ...rest: string[]): Promise<void>;
	public static async error(label: string, error: Error, ...rest: string[]): Promise<void>;
	public static async error(label: string, error: Error, ...rest: any[]): Promise<void>
	{
		Logger.instance().error(label, inspect(error, true, Infinity, true));

		// only sent to raven on non-dev
		if (Number(process.env.LOGLEVEL) === LogLevel.DEBUG) return;

		await this._raven.context(async () =>
		{
			const message: Message = rest[0];
			if (message instanceof Message)
			{
				rest = rest.slice(1);

				this._raven.captureBreadcrumb({
					category: 'Message',
					data:
					{
						author: `${message.author.tag} (${message.author.id})`,
						channel: `${message.channel instanceof GuildChannel ? message.channel.name : 'DM'} (${message.channel.id})`,
						content: message.content,
						guild: message.guild ? `${message.guild.name} (${message.guild.id})` : '',
					},
					message: 'Info about the sent message',
				});
			}

			try
			{
				const eventId: string = await RavenUtil._captureException(
					error,
					{
						extra: { rest: rest.join(' ') },
						tags: { label },
					},
				);
				Logger.instance().info('Raven', 'Logged error; eventId:', eventId);
			}
			catch (ravenError)
			{
				Logger.instance().error(
					'Raven',
					'An error occured while logging the error:',
					inspect(ravenError, true, Infinity, true),
				);
			}
		});
	}

	/**
	 * Original Raven class instance
	 * @private
	 * @static
	 * @readonly
	 */
	private static readonly _raven: Raven = new Raven(process.env.DSN,
		{
			captureUnhandledRejections: true,
			release: version,
		},
	).install();

	/**
	 * Promisified captureException
	 * @param {string} error
	 * @returns {Promise<string>} eventId
	 * @private
	 * @static
	 * @readonly
	 */
	private static readonly _captureException: (error: Error, options?: CaptureOptions) => Promise<string> =
	promisify(RavenUtil._raven.captureException).bind(RavenUtil._raven);
	/**
	 * Promisified captureMessage
	 * @param {string} message Message to log
	 * @returns {Promise<string>} eventId
	 * @private
	 * @static
	 * @readonly
	 */
	private static readonly _captureMessage: (message: string, options?: CaptureOptions) => Promise<string> =
	promisify(RavenUtil._raven.captureMessage).bind(RavenUtil._raven);
}
