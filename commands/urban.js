exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  if (!params[0]) {
    return msg.channel.sendEmbed({
      title: 'Was soll ich Nachschlagen?',
      description: `\u200b\n`,
      fields: [
        {
          name: `\u200b`,
          value: 'Antworte entweder mit `cancel` oder überlege länger als `30` Sekunden um diese Anfrage abzubrechen.',
        }],
      color: msg.member.highestRole.color,
    }).then((mes) => {
      msg.channel.awaitMessages(function filter(input, collector) { // eslint-disable-line
        if (input.author.id === this.options.mes.author.id) { // eslint-disable-line
          return true;
        } else {
          return false;
        }
      }, { mes: msg, maxMatches: 1, time: 30000, errors: ['time'] }
      ).then(collected => {
        const input = collected.first().content;
        mes.delete();
        if (input === 'cancel') {
          collected.first().delete();
          msg.delete();
        } else {
          query(bot, msg, collected.first().content.split(' '));
        }
      }).catch(err => {
        if (err.size) {
          msg.delete();
          mes.delete();
        } else {
          bot.err(err.stack ? err.stack : err);
        }
      });
    });
  } else {
    query(bot, msg, params);
  }
});


function query(bot, msg, params) {

}


exports.conf = {
  group: 'Sonstiges',
  spamProtection: false,
  enabled: true,
  aliases: ['urb'],
  permLevel: 0,
};


exports.help = {
  name: 'urban',
  shortdescription: '[Urbandic](urbandictionary.com)(Eng)',
  description: 'Ein Testbefehl, welcher das macht wozu er gerade bestimmt ist.',
  usage: '$conf.prefixtest ()/[]/""',
};
