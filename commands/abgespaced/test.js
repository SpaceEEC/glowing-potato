exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  const cmd = new Testcommand(bot);
  await cmd.run(msg, params);
};

class Testcommand {
  constructor(bot) {
    this.bot = bot;
  }
  async run(msg, params) {
    this.test();
  }

  async test() {
    return new Promise(resolve => {
      throw new Error('derp');
    });
  }
}


function nichts(bot, msg) { // eslint-disable-line no-unused-vars
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


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['bakaero'],
  permLevel: 0,
};


exports.help = {
  name: 'test',
  shortdescription: 'Oh shit',
  description: 'Ein Testbefehl, welcher das macht wozu er gerade bestimmt ist.',
  usage: '$conf.prefixtest ()/[]/""',
};
