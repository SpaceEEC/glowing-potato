const { ArgumentType } = require('discord.js-commando');

module.exports = class TagContent extends ArgumentType {
	constructor(client) {
		super(client, 'tagcontent');
	}

	validate(value, msg, arg) {
		const hasImage = Boolean(msg.message.attachments.first() && msg.message.attachments.first().height);
		const valideString = Boolean(value)
			&& (arg.min === null || typeof arg.min === 'undefined' || value.length >= arg.min)
			&& (arg.max === null || typeof arg.max === 'undefined' || value.length <= arg.max);
		if (hasImage && (valideString || !value)) return true;
		else return valideString;
	}

	parse(value, msg) {
		let parsed = value || '';
		if (msg.attachments.first() && msg.attachments.first().height) {
			parsed += `\n${msg.attachments.first().url}`;
		}
		return parsed;
	}
};
