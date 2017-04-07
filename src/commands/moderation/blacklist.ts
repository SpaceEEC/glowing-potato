import { stripIndents } from 'common-tags';
import { GuildChannel, GuildMember, Message, Role, TextChannel } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class BlacklistCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'blacklist',
			aliases: ['ignore'],
			group: 'moderation',
			memberName: 'blacklist',
			description: 'Blacklists or unblacklists a member or channel.',
			examples: [
				'`blacklist 218348062828003328` Would blacklist or unblacklist the member with that ID.',
				'`blacklist @owo` Would blacklist or unblacklist the mentioned user owo.',
				'For channels instead of users just replace the mentions or ids with channel ones.'
			],
			guildOnly: true,
			args: [
				{
					key: 'thing',
					label: 'member or channel',
					prompt: stripIndents`which Member or Channel do you wish to blacklist or unblacklist?
          This command only accepts Mentions or IDs.\n`,
					validate: async (value: string, msg: CommandMessage) => {
						const channels: string[] = value.match(/^(?:<#)+([0-9]+)>+$/);
						if (channels) return msg.guild.channels.filter((c: GuildChannel) => c.type === 'text').has(channels[1]);
						const members: string[] = value.match(/^(?:<@!?)+([0-9]+)>+$/);
						if (members) {
							try {
								return msg.guild.fetchMember(await msg.client.fetchUser(members[1]));
							} catch (err) { return false; }
						}
						if (msg.guild.channels.filter((c: GuildChannel) => c.type === 'text').has(value) || msg.guild.member(value)) return true;
						return 'This isn\'t a valid channel or member!';
					},
					parse: (value: string, msg: CommandMessage) => {
						const channels: string[] = value.match(/^(?:<#)+([0-9]+)>+$/);
						if (channels) return msg.guild.channels.get(channels[1]);
						const members: string[] = value.match(/^(?:<@!?)+([0-9]+)>+$/);
						if (members) return msg.guild.member(members[1]);
						return msg.guild.member(value) || msg.guild.channels.get(value);
					}
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		const staffRoles: string[] = this.client.provider.get(msg.guild.id, 'adminRoles', []).concat(this.client.provider.get(msg.guild.id, 'modRoles', []));
		return msg.member.roles.some((r: Role) => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	public async run(msg: CommandMessage, args: { thing: GuildMember | TextChannel }): Promise<Message | Message[]> {
		const type: { state: string, config: string, response: string } = args.thing instanceof GuildMember
			? { config: 'ingoredUsers', response: `\`${args.thing.user.username}#${args.thing.user.discriminator}\``, state: '' }
			: { config: 'ignoredChannels', response: args.thing.toString(), state: '' };
		const ignoredArray: string[] = this.client.provider.get(msg.guild.id, type.config, []);
		if (ignoredArray.includes(args.thing.id)) {
			type.state = 'no longer';
			ignoredArray.splice(ignoredArray.indexOf(args.thing.id));
		} else {
			type.state = 'now';
			ignoredArray.push(args.thing.id);
		}
		this.client.provider.set(msg.guild.id, type.config, ignoredArray);
		return msg.say(`${type.response} is ${type.state} being ingored`);
	}
};
