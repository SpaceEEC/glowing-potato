const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const package = require('../package.json');

exports.run = (bot, msg, params = []) => new Promise((resolve, reject) => { // eslint-disable-line
  let member;
  if (msg.content.slice(msg.conf.prefix.length).split(' ')[0].toLowerCase() === 'info') {
    member = bot.user;
  } else {
    member = msg.mentions.users.first() ? msg.mentions.users.first() : msg.author;
  }
  const gmember = msg.guild.member(bot.users.get(member.id));
  if (!member) { return msg.channel.sendMessage('Fehler im Code, bitte `@space#0302` anschreiben.'); }
  let embed;
  if (member !== bot.user) {
    try {
      embed = {
        color: 0xffa500,
        author: {
          name: `Stats`,
          icon_url: member.avatarURL,
          url: member.avatarURL,
        },
        description: `${gmember.toString()}`,
        fields: [
          {
            name: '❯ Clientseitig',
            value: `• Avatar: ${member.avatarURL ? `[Link](${member.avatarURL})` : 'Kein Avatar'}
• Account erstellt am:
${moment(member.createdAt).format('DD.MM.YYYY')}
• Status: \`${member.presence.status}\`
• Spiel: \n\`${member.presence.game ? member.presence.game.name : 'Kein Spiel'}\``,
            inline: true,
          },
          {
            name: '❯ Serverseitig:',
            value: `${gmember.nickname ? `• Nickname: \`${gmember.nickname}\`` : ''}
• Beigetreten:\n${moment(gmember.joinedAt).format('DD.MM.YYYY')}
${msg.author === member ? `• Permissionlevel:\n\`${msg.permlvl}\`` : ''}`,
            inline: true,
          },
        ],
        thumbnail: {
          url: member.avatarURL,
        },
        timestamp: new Date(),
        footer: {
          icon_url: bot.user.avatarURL,
          text: msg.content,
        },
      };
    } catch (e) {
      return msg.channel.sendMessage(`Es ist ein Fehler beim Erstellen der Antwort aufgetreten:\n${e.stack}`);
    }
  } else {
    embed = {
      color: 0xffa500,
      title: 'Infos über den Bot.',
      description: '\u200b',
      fields: [
        {
          name: '❯ Online seit:',
          value: `• ${moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Minuten], s [Sekunden]')}`,
          inline: true,
        },
        {
          name: '❯ Speicherbelegung:',
          value: `• ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          inline: true,
        },
        {
          name: '❯ Befehle geladen:',
          value: `• ${Array.from(bot.commands).length}`,
          inline: true,
        },
        {
          name: '❯ spacebot-Version:',
          value: `• v${package.version} ([glowing-potato](http://puu.sh/teDYW/d6f9555fbd.png))`,
          inline: true,
        },
        {
          name: '❯ Shitcode repositorie:',
          value: '• [GitHub](https://github.com/SpaceEEC/glowing-potato)',
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
        },
      ],
      timestamp: new Date(),
      thumbnail: {
        url: bot.user.avatarURL,
      },
      footer: {
        icon_url: msg.author.avatarURL,
        text: msg.content,
      },
    };
  }
  return msg.channel.sendEmbed(embed);
});


exports.conf = {
  group: 'Allgemeines',
  spamProtection: false,
  enabled: true,
  aliases: ['stats'],
  permLevel: 0,
};


exports.help = {
  name: 'info',
  description: 'Gibt Informationen über den angegebenen (oder deinem) Clienten an.',
  shortdescription: 'oder auch stats.',
  usage: '$conf.prefixstats (@mention)',
};
