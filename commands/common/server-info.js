const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const moment = require('moment');
moment.locale('de');

module.exports = class ServerinfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'server-info',
      alises: ['guild-info'],
      group: 'common',
      memberName: 'server-info',
      description: 'General informations about this guild.',
      guildOnly: true,
    });
  }

  async run(msg) {
    return msg.embed(new Embed()
      .setColor(0xffa500).setTitle('Informations about this guild.')
      .setThumbnail(msg.guild.iconURL)
      .addField('❯ Channel:', stripIndents`• \`${msg.guild.channels.filter(c => c.type === 'text').size}\` Textchannel
      • \`${msg.guild.channels.filter(c => c.type === 'voice').size}\` Voicechannel`, true)
      .addField('❯ Member:', `• \`${msg.guild.memberCount}\` Member\n• Owner: ${msg.guild.owner}`, true)
      .addField('❯ General:', stripIndents`• \`${msg.guild.roles.size}\` Roles
      • Region: ${this.capitalize(msg.guild.region)}`, true)
      .addField('\u200b', `• Created: ${moment(msg.guild.createdAt).format('DD.MM.YYYY [\n   Um:] hh:mm:ss')}`, true)
      .addField('❯ Emojis:', this.getRandomEmojis(msg))
    );
  }

  capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  getRandomEmojis(msg) {
    const emojis = msg.guild.emojis.map(e => e.toString());
    let currentIndex = emojis.length;
    let temporaryValue;
    let randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      temporaryValue = emojis[currentIndex];
      emojis[currentIndex] = emojis[randomIndex];
      emojis[randomIndex] = temporaryValue;
    }
    let response = '';
    for (const emoji of emojis) {
      if ((response.length + emoji.length) > 1021) {
        response += '...';
        break;
      } else { response += ` ${emoji}`; }
    }
    return response;
  }
};
