module.exports = class Test {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params) { // eslint-disable-line no-unused-vars
    msg.channel.sendEmbed(this.nichts(this.bot, msg));
  }


  nichts(bot, msg) { // eslint-disable-line no-unused-vars
    return {
      color: 0xFFFF00,
      author: {
        icon: bot.user.avatarURL,
        name: bot.user.username,
      },
      fields: [
        {
          name: '¯\_(ツ)_/¯', // eslint-disable-line no-useless-escape
          value: 'Dieser Befehl macht gerade nichts.\nVersuche es doch später erneut.',
        },
      ],
      thumbnail: { url: bot.user.avatarURL },
      timestamp: new Date(),
      footer: {
        icon_url: msg.author.avatarURL,
        text: msg.content,
      },
    };
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['bakaero'],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'test',
      shortdescription: 'Oh shit',
      description: 'Ein Testbefehl, welcher das macht wozu er gerade bestimmt ist.',
      usage: '$conf.prefixtest ()/[]/""',
    };
  }
};
