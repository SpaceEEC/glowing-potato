exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  return msg.channel.sendEmbed(nichts(bot, msg));
});

exports.conf = {
  group: 'abgespaced',
  spamProtection: false,
  enabled: true,
  aliases: ['bakaero'],
  permLevel: 0,
};

exports.help = {
  name: 'test',
  shortdescription: 'Test',
  description: 'Ein Testbefehl, welcher das macht wozu er gerade bestimmt ist.',
  usage: '$conf.prefixtest ()/[]/""',
};

function nichts(bot, msg) { // eslint-disable-line
  return {
    color: 0xFFFF00,
    // description: '\u200B',
    author: {
      icon: bot.user.avatarURL,
      name: bot.user.username,
    },
    fields: [
      {
        name: '¯\_(ツ)_/¯', // eslint-disable-line
        value: 'Dieser Befehl macht gerade nichts.\nVersuche es doch später erneut.',
      },
    ],
    thumbnail: {
      url: bot.user.avatarURL,
    },
    timestamp: new Date(),
    footer: {
      icon_url: msg.author.avatarURL,
      text: msg.content,
    },
  };
}
