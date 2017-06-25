import { DiscordAPIError, Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { inspect } from 'util';

import { stripIndents } from 'common-tags';
import { Util } from '../../util/util.js';

// tslint:disable-next-line:variable-name
const RealDiscordAPIError: typeof DiscordAPIError = require('discord.js/src/client/rest/DiscordAPIError.js');

export default class EvalCommand extends Command {
	public constructor(client: CommandoClient) {
		super(client, {
			aliases: ['async', 'await'],
			args: [
				{
					key: 'code',
					prompt: 'what shall I evaluate?\n',
					type: 'string',
				},
			],
			description: 'Evaluates code in NodeJS.',
			group: 'util',
			guarded: true,
			memberName: 'eval',
			name: 'eval',
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { code: string }): Promise<Message | Message[]> {
		const time: number = Date.now();
		try {
			if (Util.getUsedAlias(msg) === 'async') args.code = `(async()=>{${args.code}})();`;

			let evaled: any;
			// tslint:disable-next-line:no-eval
			evaled = await Promise.resolve(eval(args.code));

			const typeofEvaled: string = typeof evaled;
			if (typeofEvaled !== 'string') evaled = inspect(evaled, false, 0);
			if (evaled.includes(this.client.token)) return msg.say('The token does not belong in here. 👀');

			return msg.say(stripIndents
				`\`returned\` \`typeof:\` \`${typeofEvaled}\`
				\`\`\`js
				${evaled ? evaled.split('`').join('´') : 'falsy'}
				\`\`\`
				Took \`${Date.now() - time}\`ms`,
			).catch((e: Error) =>
				msg.say(stripIndents
					`Fehler beim Senden der Antwort:

					\`\`\`js
					${e.stack ? e.stack : e}
					\`\`\``,
				),
			);
		} catch (error) {
			if (error instanceof RealDiscordAPIError) {
				return msg.say(stripIndents
					`\`E-ROHR\` \`Code\` \`${error.code}\`

					\`\`\`js
					${error.message}
					\`\`\`
					Took \`${Date.now() - time}\`ms`,
				);
			} else {
				return msg.say(stripIndents
					`\`E-ROHR\`
					\`\`\`js
					${inspect(error, false, 0)}
					\`\`\`
					Took \`${Date.now() - time}\`ms`,
				);
			}
		}
	}
}
