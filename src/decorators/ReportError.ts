import { TextChannel } from 'discord.js';
import { Command, Lang, Message, ResourceLoader } from 'yamdbf';

import { LocalizationStrings as S } from '../localization/LocalizationStrings';
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

	descriptor.value = async function execute(this: Command<Client>, message: Message, args: any[]): Promise<string>
	{
		try
		{
			return await original.apply(this, [message, args]);
		}
		catch (error)
		{

			await RavenUtil.error(this.name, error, message)
				.catch(() => null);

			const lang: string = message.channel instanceof TextChannel
				? await message.guild.storage.settings.get('lang') || this.client.defaultLang
				: this.client.defaultLang;
			const res: ResourceLoader = Lang.createResourceLoader(lang);

			return res(S.DECORATORS_REPORT_ERROR_TEXT, { message: error.message });
		}
	};

	return descriptor;
}
