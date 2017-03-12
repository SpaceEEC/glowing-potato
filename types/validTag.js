const { ArgumentType } = require('discord.js-commando');
const { join } = require('path');
const Tag = require(join(__dirname, '..', 'dataProviders', 'models', 'Tag'));

module.exports = class ValidTag extends ArgumentType {
	constructor(client) {
		super(client, 'validtag');
	}
	// max is here for new.

	async validate(value, msg, args) {
		await Tag.sync();
		const name = value.toLowerCase();
		const tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (args.max) return !tag;
		return tag;
	}

	async parse(name, msg, args) {
		if (args.max) return name.toLowerCase();
		else return Tag.findOne({ where: { name, guildID: msg.guild.id } });
	}
};
