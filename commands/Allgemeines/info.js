const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const package = require('../../package.json');


exports.run = async (bot, msg, params = []) => {
  let user;
  if (msg.cmd === 'info') {
    user = bot.user;
  } else {
    user = msg.mentions.users.size !== 0 ? msg.mentions.users.first()
      : bot.users.has(params[0]) ? bot.users.get(params[0]) : msg.author;
  }
  const member = await msg.guild.fetchMember(user);
  if (!member) return msg.channel.sendMessage('Dieser Nutzer befindet sich in der Datenbank, ist aber nicht in dieser Gilde zu finden.');
  let embed;
  if (user !== bot.user) {
    try {
      embed = {
        color: 0xffa500,
        author: {
          name: `Stats`,
          icon_url: user.displayAvatarURL,
          url: user.displayAvatarURL,
        },
        description: member.toString(),
        fields: [
          {
            name: '❯ Clientseitig',
            value: `• Avatar: ${user.avatarURL ? `[Link](${user.avatarURL})` : 'Kein Avatar'}
• Account erstellt am:
${moment(user.createdAt).format('DD.MM.YYYY')}
• Status: \`${user.presence.status}\`
• Spiel: \n\`${user.presence.game ? user.presence.game.name : 'Kein Spiel'}\``,
            inline: true,
          },
          {
            name: '❯ Serverseitig:',
            value: `${
            member.nickname ? `• Nickname: \`${member.nickname}\`` : ''}
• Beigetreten am:
${moment(member.joinedAt).format('DD.MM.YYYY')}
${msg.author === user ? `• Permissionlevel:\n\`${msg.permlvl}\`` : ''}`,
            inline: true,
          },
        ],
        thumbnail: { url: user.displayAvatarURL },
        timestamp: new Date(),
        footer: {
          icon_url: msg.author.avatarURL,
          text: msg.content,
        },
      };
    } catch (e) {
      bot.err(`[info stats] ${e.stack}`);
      return msg.channel.sendMessage(`Es ist ein Fehler beim Erstellen der Antwort aufgetreten.\n\nBitte kontaktiere: \`${bot.config.owner}\``);
    }
  } else {
    embed = {
      color: 0xffa500,
      title: 'Infos über den Bot.',
      description: '\u200b',
      fields: [
        {
          name: '❯ Online seit:',
          value: `• ${moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Min.], s [Sek.]')}`,
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
      thumbnail: { url: bot.user.avatarURL },
      footer: {
        icon_url: msg.author.avatarURL,
        text: msg.content,
      },
    };
  }
  return msg.channel.sendEmbed(embed);
};


exports.conf = {
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
