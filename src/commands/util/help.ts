import { oneLine, stripIndents } from 'common-tags';
import { Collection, Message, RichEmbed } from 'discord.js';
import { Command, CommandGroup, CommandMessage, CommandoClient, util } from 'discord.js-commando';
import * as moment from 'moment';
import Util from '../../util/util.js';

type RichEmbedField = { name: string; value: string; inline?: boolean; };

export default class HelpCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'help',
			group: 'util',
			aliases: ['commands'],
			memberName: 'help',
			description: 'Displays help.',
			details: stripIndents`
				Displays a list of available commands, or detailed information for a specified command.
				The input may be part of a command name or a whole command name/group.
				If it isn't specified, all available command groups will be listed.
			`,
			examples: ['help', 'help prefix'],
			guarded: true,

			args: [
				{
					key: 'input',
					prompt: 'For which command or group would you like to view the help for?',
					type: 'string',
					default: '',
					parse: (input: string) => input.toLowerCase()
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { input: string }): Promise<Message | Message[]> {
		const prefix: string = msg.guild ? msg.guild.commandPrefix : null;

		if (!args.input || args.input === 'all') return this.displayGroups(msg, args.input.endsWith('all'), prefix);
		return this.displayGroup(msg, args.input, prefix) || this.displayCommand(msg, args.input, prefix) || msg.say(`Unable to identify command. Use ${msg.usage(null, prefix, prefix ? this.client.user : null)} to view the list of all commands.`);
	}

	private displayGroups(msg: CommandMessage, all: boolean, prefix: string): Promise<Message | Message[]> {
		const usableGroups: Collection<string, CommandGroup> = all ? this.client.registry.groups : this.client.registry.groups.filter((group: CommandGroup) => group.commands.some((command: Command) => command.isUsable(msg.message)));
		const embed: RichEmbed = new RichEmbed()
			.setColor('RANDOM')
			.setTitle('Command groups overview')
			.setDescription(stripIndents`To run a command in ${msg.guild || 'any server'},
						use ${Command.usage('command', prefix, this.client.user)}.
						For example, ${Command.usage('help', prefix, this.client.user)}.

						To list all commands by their groupname use ${Command.usage('help <group>', prefix, null)}.
						For more info about a command use  ${Command.usage('help <command>', prefix, null)}.
						${all ? 'All existing groups' : 'All groups with at least one command you can use.'}`);

		for (const group of usableGroups.values()) {
			embed.addField(group.name, `${group.commands.filter((command: Command) => command.isUsable(msg.message)).size}/${group.commands.size} usable.`, true);
		}

		let remainder: number = embed.fields.length % 3;
		if (remainder) for (++remainder; remainder <= 3; ++remainder) embed.addBlankField(true);
		embed.fields.sort((a: RichEmbedField, b: RichEmbedField) => +(a.name > b.name));

		return msg.embed(embed);
	}

	private displayGroup(msg: CommandMessage, input: string, prefix: string): Promise<Message | Message[]> {
		const all: boolean = input.endsWith('all');

		let groups: CommandGroup[] = this.client.registry.findGroups(input.split(' ')[0], false);
		if (!all) groups = groups.filter((group: CommandGroup) => group.commands.some((command: Command) => command.isUsable(msg.message)));

		if (groups.length === 1) {
			const group: CommandGroup = groups[0];
			const embed: RichEmbed = new RichEmbed()
				.setColor('RANDOM')
				.setTitle(`Commands of ${group.name}`)
				.setDescription(stripIndents`
					Use ${msg.anyUsage('help <command>', prefix, this.client.user)}	for more info regarding the specified command.

					${all ? 'Display all commands' : stripIndents`Only dispaly usable commands
						To see all commands append \`all\` to the command.`}`);

			for (const command of group.commands.values()) {
				if (!all && !command.isUsable(msg.message)) continue;
				embed.addField(command.name, stripIndents`
					${command.description}
					${command.usage(command.format ? `${command.format}` : '', prefix, null)}
					`, true);
			}

			let remainder: number = embed.fields.length % 3;
			if (remainder) for (++remainder; remainder <= 3; ++remainder) embed.addBlankField(true);
			embed.fields.sort((a: RichEmbedField, b: RichEmbedField) => +(a.name > b.name));

			return msg.embed(embed);
		}

		if (groups.length) return msg.say(util.disambiguation(groups, 'groups'));
	}

	private displayCommand(msg: CommandMessage, input: string, prefix: string): Promise<Message | Message[]> {
		const commands: Command[] = this.client.registry.findCommands(input.split(' ')[0], false);

		if (commands.length === 1) {
			const command: Command = commands[0];
			const embed: RichEmbed = new RichEmbed()
				.setColor('RANDOM').setTitle(oneLine`
			__**${command.name[0].toUpperCase() + command.name.slice(1)}**__ command: 
			${command.description} ${command.guildOnly ? ' (Usable only in servers)' : ''}`)
				.setDescription(stripIndents`
			**Format:** ${msg.anyUsage(`${command.name}${command.format ? ` ${command.format}` : ''}`)}
			**Aliases:** ${command.aliases.join(', ') || 'No Aliases'}
			**Group:** ${command.group.name} (\`${command.groupID}:${command.memberName}\`)
			**Details:**\n${command.details || command.description}
			${command.examples ? `__**Examples:**__\n${command.examples.join('\n')}` : ''}`);

			return msg.embed(embed);
		}

		if (commands.length) return msg.say(util.disambiguation(commands, 'commands'));
	}
};
