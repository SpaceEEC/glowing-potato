import { Command, Message } from 'yamdbf/bin';

export function ReportError(target: Command, key: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
	if (!target) throw new Error('@ReportError must be used as a method decorator for a Command action method.');
	if (key !== 'action') throw new Error(`"${target.constructor.name}#${key}" is not a valid method target for @using.`);
	if (!descriptor) descriptor = Object.getOwnPropertyDescriptor(target, key);

	const original: any = descriptor.value;

	descriptor.value = async function execute(this: Command<any>, message: Message, args: any[]): Promise<any>
	{
		try
		{
			return await original.apply(this, [message, args]);
		}
		catch (err)
		{
			await message.channel.send(err.toString(), { code: 'js', split: true });
			throw err;
		}
	};

	return descriptor;
}
