import { CaptureOptions, Client as Raven } from 'raven';
import { inspect, promisify } from 'util';
import { LogData, Logger, LogLevel } from 'yamdbf';

import { Config } from '../types/config';

const { logLevel, dsn }: Config = require('../../config.json');
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
		Logger.instance().addTransport(({ timestamp, type, tag, text }: LogData) =>
		{
			// only sent to raven on non-dev
			if (logLevel === LogLevel.DEBUG) return;

			// ignore raven log messages
			if (tag === 'Raven') return;

			// those colors
			if (type.includes('WARN'))
			{
				RavenUtil._captureMessage(text, { level: 'warning', tags: { label: tag } })
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
			}
		});
	}

	/**
	 * Logs an exception to sentry and relays the error also to the built-in logger.
	 * @param {string} label Label for the logger
	 * @param {Error} error Error to log
	 * @param {...string} rest Additional strings
	 * @returns {Promise<void>}
	 * @static
	 */
	public static async error(label: string, error: Error, ...rest: string[]): Promise<void>
	{
		Logger.instance().error(label, inspect(error, true, Infinity, true));

		// only sent to raven on non-dev
		if (logLevel === LogLevel.DEBUG) return;

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
	}

	/**
	 * Original Raven class instance
	 * @private
	 * @static
	 * @readonly
	 */
	private static readonly _raven: Raven = new Raven(dsn, {
		captureUnhandledRejections: true,
		release: version,
	}).install();

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
