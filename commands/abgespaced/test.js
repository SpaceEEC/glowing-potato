exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  return msg.channel.sendEmbed(nichts(bot, msg));
};


function nichts(bot, msg) {
  return {
    color: 0xFFFF00,
    // description: '\u200B',
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
