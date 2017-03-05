const { Command, FriendlyError } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { join } = require('path');
const Tag = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'Tag'));

module.exports = class TagList extends Command {
  constructor(client) {
    super(client, {
      name: 'tag-list',
      aliases: ['tags'],
      group: 'tags',
      memberName: 'tags-list',
      description: 'Lists all tags.',
      guildOnly: true,
    });
  }

  async run(msg, args) { // eslint-disable-line no-unused-vars
    await Tag.sync();
    const tags = (await Tag.findAll({ where: { guildID: msg.guild.id } })).map(t => t.dataValues);
    if (!tags.length) throw new FriendlyError(`no tags in this guild yet, be the first one to add one!`);

    let alle = tags.filter(tag => tag.userID !== msg.author.id).map(tag => `\`${tag.name}\``).sort();
    let user = tags.filter(tag => tag.userID === msg.author.id).map(tag => `\`${tag.name}\``).sort();

    if (!alle[0]) alle = ['All tags on this guild belongs to you! You can ask others to add tags too.'];
    if (!user[0]) user = ['You have not added any tags yet, go add some!'];

    msg.channel.sendEmbed(new Embed().setTimestamp().setColor(0x3498db)
      .setFooter(`${msg.author.username}: ${msg.content}`, this.client.user.avatarURL)
      .addField(`${msg.author.username} tags:`, user.join(' '))
      .addField('Other tags:', alle.join(' '))
      .setThumbnail(this.client.user.avatarURL)
    );
  }
};
