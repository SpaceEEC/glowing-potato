const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const moment = require('moment');
moment.locale('de');

module.exports = class MemberinfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'member-info',
      aliases: ['user-info'],
      group: 'common',
      memberName: 'member-info',
      description: 'General informations about the specified member.',
      guildOnly: true,
      args: [
        {
          key: 'member',
          label: 'Member',
          prompt: 'which members informations would you like to see?\n',
          type: 'member',
          default: ''
        }
      ]
    });
  }

  async run(msg, args) {
    const member = args.member || msg.member;
    const user = member.user;

    msg.embed(new Embed()
      .setColor(0xffa500).setAuthor('Stats', user.displayAvatarURL, user.displayAvatarURL)
      .setDescription(member.toString())
      .addField('❯ User informations', stripIndents`• Avatar: ${user.avatarURL ? `[Link](${user.avatarURL})` : 'No Avatar'}
        • Created: ${moment(user.createdAt).format('DD.MM.YYYY')}
        • Status: \`${user.presence.status}\`
        • Game: \`${user.presence.game ? user.presence.game.name : 'No Game'}\``, true)
      .addField('❯ Server informations:', stripIndents`${
        member.nickname ? `• Nickname: \`${member.nickname}\`` : ''}
        • Joined: ${moment(member.joinedAt).format('DD.MM.YYYY')}
        • roles: ${member.roles.filter(r => r.id !== member.guild.id).map(r => r.toString()).join(' ')}`, true)
      .setThumbnail(user.displayAvatarURL)
      .setTimestamp()
      .setFooter(msg.content, msg.author.avatarURL));
  }
};
