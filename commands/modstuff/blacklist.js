const { Command } = require('discord.js-commando');
const { GuildMember } = require('discord.js');

module.exports = class BlacklistCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'blacklist',
      aliases: ['ignore'],
      group: 'modstuff',
      memberName: 'blacklist',
      description: 'Blacklists or unblacklists a member or channel.',
      guildOnly: true,
      args: [
        {
          key: 'thing',
          label: 'member or channel',
          prompt: 'which Member or Channel do you wish to blacklist or unblacklist?\n',
          validate: async (value, msg) => {
            const channel = value.match(/^(?:<#)+([0-9]+)>+$/);
            if (channel) return msg.guild.channels.has(channel[1]);
            const member = value.match(/^(?:<@!?)+([0-9]+)>+$/);
            if (member) {
              try {
                return msg.guild.fetchMember(await msg.client.fetchUser(member[1]));
              } catch (err) { return false; }
            }
            if (msg.guild.channels.has(value) || msg.guild.member(value)) return true;
            return 'This isn\'t a valid channel or member';
          },
          parse: (value, msg) => {
            const channel = value.match(/^(?:<#)+([0-9]+)>+$/);
            if (channel) return msg.guild.channels.get(channel[1]);
            const member = value.match(/^(?:<@!?)+([0-9]+)>+$/);
            if (member) return msg.guild.member(member[1]);
            return msg.guild.member(value) || msg.guild.channels.get(value);
          }
        }
      ]
    });
  }

  hasPermission(msg) {
    const staffRoles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));
    return msg.member.roles.some(r => staffRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    const type = args.thing instanceof GuildMember
      ? { config: 'ingoredUsers', response: `\`${args.thing.user.username}#${args.thing.user.discriminator}\`` }
      : { config: 'ignoredChannels', response: args.thing };
    const ignoredArray = msg.guild.settings.get(type.config, []);
    if (ignoredArray.includes(args.thing.id)) {
      type.state = 'no longer';
      ignoredArray.splice(ignoredArray.indexOf(args.thing.id));
    } else {
      type.state = 'now';
      ignoredArray.push(args.thing.id);
    }
    msg.say(`${type.response} is ${type.state} being ingored`);
    msg.guild.settings.set(type.config, ignoredArray);
  }
};

