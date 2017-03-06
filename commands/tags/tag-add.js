const { Command } = require('discord.js-commando');
const { join } = require('path');
const tag = require(join(__dirname, '..', '..', 'dataProviders', 'models', 'Tag'));

module.exports = class TagAdd extends Command {
  constructor(client) {
    super(client, {
      name: 'tag-add',
      group: 'tags',
      memberName: 'tag-add',
      description: 'Adds a tag.',
      guildOnly: true,
      args: [
        {
          key: 'name',
          prompt: 'how shall the tag be named?\n',
          type: 'validtag',
          max: 1
          // max = new, because reasons
          // lowercases
        },
        {
          key: 'content',
          label: 'inhalt',
          prompt: 'what shall the content be?\n',
          type: 'tagcontent',
          max: 1800
        }
      ]
    });
  }

  async run(msg, args) {
    const { name, content } = args;

    await tag.create({ name, guildID: msg.guild.id, userID: msg.author.id, content });

    msg.say(`Tag **${name}** sucessfully created!`);
  }
};
