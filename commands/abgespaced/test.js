exports.run = async (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  const guilds = await bot.db.all('SELECT * FROM confs');
  for (const guild of guilds) {
    for (const i in guild) {
      console.log([i, guild[i], guild.id]);
      if (i === 'id') continue;
      await bot.db.run(`UPDATE confs SET '${i}'=? WHERE id=?`,
        [JSON.stringify(guild[i]), guild.id]).catch(console.error);
      console.log('ran');
    }
    await bot.db.run(`UPDATE confs SET 'id'=? WHERE id=?`,
      [JSON.stringify(guild.id), guild.id]).catch(console.error);
    console.log('finished');
  }
};


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
