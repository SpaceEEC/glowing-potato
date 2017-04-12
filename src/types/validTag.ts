import { ArgumentType, CommandMessage, CommandoClient } from 'discord.js-commando';
import Tag from '../dataProviders/models/Tag';

module.exports = class ValidTag extends ArgumentType {
	constructor(client: CommandoClient) {
		super(client, 'validtag');
	}

	public async validate(value: string, msg: CommandMessage, args: any): Promise<boolean> {
		const name: string = value.toLowerCase();
		const tag: Tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } }) as Tag;
		if (args.max) return !tag;
		return Boolean(tag);
	}

	public parse(value: string, msg: CommandMessage, arg: any): Promise<any> | string {
		value = value.toLowerCase();
		if (arg.max) return value;
		else return Tag.findOne({ where: { name: value, guildID: msg.guild.id } }) as any;
	}
};
