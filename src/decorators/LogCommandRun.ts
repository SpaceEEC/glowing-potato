import { Command, Message } from 'yamdbf';

import { Client } from '../structures/Client';

export function LogCommandRun(target: Command, key: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
	if (!target) throw new Error('@LogCommandRun must be used as a method decorator for a Command action method.');
	if (key !== 'action')
	{
		throw new Error(`"${target.constructor.name}#${key}" is not a valid method target for @LogCommandRun.`);
	}
	if (!descriptor) descriptor = Object.getOwnPropertyDescriptor(target, key);

	const original: (message: Message, args: any[]) => Promise<void> = descriptor.value;

	descriptor.value = async function execute(this: Command<Client>, message: Message, args: any[]): Promise<void>
	{
		this.client.logger.debug(this.constructor.name.toUpperCase(),
			`(${message.guild ? message.guild.id : 'DM'}): ${message.author.tag}: ${message.content}`);
		return original.apply(this, [message, args]);
	};

	return descriptor;
}
