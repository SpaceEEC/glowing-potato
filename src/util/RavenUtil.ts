import { CaptureOptions, Client as Raven } from 'raven';
import { inspect, promisify } from 'util';
import { LogData, Logger } from 'yamdbf';

import { Config } from '../types/config';

const { dsn }: Config = require('../../config.json');
const { version }: { version: string } = require('../../package.json');

/**
 * Static RavenUtil class which holds promisified method wrappers for Raven.
 * @static
 */
export class RavenUtil
{
	/**
	 * Original Raven class instance
	 * @static
	 * @readonly
	 */
	public static readonly raven: Raven = new Raven(dsn, {
		captureUnhandledRejections: true,
		release: version,
	}).install();

	/**
	 * Promisified captureException
	 * @param {string} error
	 * @returns {Promise<string>} eventId
	 * @static
	 * @readonly
	 */
	public static readonly captureException: (error: Error, options?: CaptureOptions) => Promise<string> =
	promisify(RavenUtil.raven.captureException).bind(RavenUtil.raven);
	/**
	 * Promisified captureMessage
	 * @param {string} message Message to log
	 * @returns {Promise<string>} eventId
	 * @static
	 * @readonly
	 */
	public static readonly captureMessage: (message: string, options?: CaptureOptions) => Promise<string> =
	promisify(RavenUtil.raven.captureMessage).bind(RavenUtil.raven);

	/**
	 * Initiates the static RavenUtil class.
	 * @returns {void}
	 * @static
	 */
	public static init(): void
	{
		Logger.instance().addTransport(({ timestamp, type, tag, text }: LogData) =>
		{
			if (tag === 'Raven') return;

			// those colors
			if (type.includes('WARN'))
			{
				RavenUtil.captureMessage(text, { level: 'warning', tags: { label: tag } })
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
		try
		{
			const eventId: string = await RavenUtil.captureException(
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
}
