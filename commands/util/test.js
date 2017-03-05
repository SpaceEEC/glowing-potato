const { Command } = require('discord.js-commando');

module.exports = class TestCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'test',
      aliases: ['bakaero'],
      group: 'util',
      memberName: 'test',
      description: 'A test command usually does nothing.',
    });
  }

  async run(msg, args) { // eslint-disable-line no-unused-vars
    msg.embed(this.nichts(msg));
  }

  nichts(msg) { // eslint-disable-line no-unused-vars
    return {
      color: 0xFFFF00,
      author: {
        icon: this.client.user.avatarURL,
        name: this.client.user.username,
      },
      fields: [
        {
          name: '¯\\_(ツ)_/¯',
          value: 'This command does nothing.\nBetter luck next time.',
        },
      ],
      thumbnail: { url: this.client.user.avatarURL },
      timestamp: new Date(),
      footer: {
        icon_url: msg.author.avatarURL,
        text: msg.content,
      },
    };
  }

};
