const { Command, FriendlyError } = require('discord.js-commando');
const { join } = require('path');
const tag = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'Tag'));

module.exports = class TagDel extends Command {
  constructor(client) {
    super(client, {
      name: 'tag-del',
      group: 'tags',
      memberName: 'tag-del',
      description: 'Deletes a tag.',
      examples: [
        '`tag-del meme`',
        'Deletes the tag `meme`.',
      ],
      guildOnly: true,
      args: [
        {
          key: 'tag',
          prompt: 'which tag shall be deleted?\n',
          type: 'validtag',
        }
      ]
    });
  }

  async run(msg, args) {
    const member = await msg.guild.fetchMember(msg.author);

    const { id: guildID } = msg.guild;
    const { userID, name } = args.tag;

    const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []));

    if (userID !== msg.author.id && !member.hasPermission('ADMINISTRATOR') && !this.client.isOwner(member) && !msg.member.roles.some(r => roles.includes(r.id))) {
      throw new FriendlyError(`you can not delete the **${name}** tag, since it was not created by yourself!`);
    }
    await tag.destroy({ where: { guildID, name } });

    msg.say(`The tag **${name}** was deleted!`);
  }

};
