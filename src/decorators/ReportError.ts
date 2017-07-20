import { Command, Message } from 'yamdbf';

import { Client } from '../structures/Client';
import { RavenUtil } from '../util/RavenUtil';

export function ReportError(target: Command, key: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
	if (!target) throw new Error('@ReportError must be used as a method decorator for a Command action method.');
	if (key !== 'action')
	{
		throw new Error(`"${target.constructor.name}#${key}" is not a valid method target for @ReportError.`);
	}
	if (!descriptor) descriptor = Object.getOwnPropertyDescriptor(target, key);

	const original: (message: Message, args: any[]) => Promise<void> = descriptor.value;

	descriptor.value = async function execute(this: Command<Client>, message: Message, args: any[]): Promise<void>
	{
		try
		{
			return await original.apply(this, [message, args]);
		}
		catch (err)
		{

			await RavenUtil.error(this.name, err)
				.catch(() => null);

			await message.channel.send([
				`An unexpected error occured while running the command: \`${err.message}\``,
				'',
				'This issue has been reported and will ~~hopefully~~ be sorted out in no time!',
			]);
		}
	};

	return descriptor;
}
