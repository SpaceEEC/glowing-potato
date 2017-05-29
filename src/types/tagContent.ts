import { ArgumentType, CommandMessage, CommandoClient } from 'discord.js-commando';

module.exports = class TagContent extends ArgumentType {
	public constructor(client: CommandoClient) {
		super(client, 'tagcontent');
	}

	public validate(value: string, msg: CommandMessage, arg: any): boolean | string {
		const hasImage: boolean = Boolean(msg.attachments.first() && msg.attachments.first().height);

		const valideString: boolean = Boolean(value)
			&& (arg.max === null
				|| typeof arg.max === 'undefined'
				|| value.length <= arg.max
				);

		if (hasImage && (valideString || !value)) return true;
		else return valideString;
	}

	public parse(value: string, msg: CommandMessage): string {
		let parsed: string = value || '';

		if (msg.attachments.first() && msg.attachments.first().height) {
			parsed += `\n${msg.attachments.first().url}`;
		}

		return parsed;
	}
};
