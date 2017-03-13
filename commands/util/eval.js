const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const { getUsedAlias } = require('../../util/util.js');

module.exports = class EvalCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'eval',
			aliases: ['async'],
			group: 'util',
			memberName: 'eval',
			description: 'Evaluates code in NodeJS.',
			guarded: true,
			args: [
				{
					key: 'code',
					prompt: 'what shall I evaluate?\n',
					type: 'string'
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.isOwner(msg.author);
	}

	async run(msg, args) {
		const time = +new Date;
		try {
			let evaled;
			if (getUsedAlias(msg) === 'async') evaled = eval(`(async()=>{${args.code}})();`);
			else evaled = eval(args.code);
			if (evaled instanceof Promise) evaled = await evaled;
			const response_typeof = typeof evaled;
			if (typeof evaled !== 'string') { evaled = require('util').inspect(evaled, false, 0); }
			if (evaled.includes(this.client.token)) {
				msg.say('The token doesn\'t belong in here. 👀');
				return;
			}
			msg.say(stripIndents`\`code:\`
      \`\`\`js\n${args.code ? args.code.split(`\``).join(`´`) : 'falsy'}\`\`\`
      \`evaled\\returned:\`
      \`\`\`js\n${evaled ? evaled.split(`\``).join(`´`) : 'falsy'}\`\`\`
      \`typeof:\`
      \`\`\`js\n${response_typeof}
      \`\`\`\n
      Took \`${new Date().getTime() - time}\`ms`)
				.catch((e) => {
					msg.say(`Fehler beim Senden der Antwort:\n
          \`\`\`js
          ${e.stack ? e.stack : e}
          \`\`\``);
				});
		} catch (e) {
			msg.say(stripIndents`\`E-ROHR\`
      \`\`\`js
      ${e}${e.response && e.response.res && e.response.res.text ? `\n${e.response.res.text}` : ''}
      \`\`\`\n
      Took \`${new Date().getTime() - time}\`ms`);
		}
	}

};
