module.exports = class GGEZ {
  constructor(bot) {
    this.bot = bot;
  }


  async run(msg, params = []) { // eslint-disable-line no-unused-vars
    const embed = new this.bot.methods.Embed()
      .setAuthor(`${msg.member.displayName}:`, msg.author.displayAvatarURL)
      .setColor(msg.member.highestRole.color)
      .setTitle('\u200b')
      .setDescription(`**${this.messages}**\n\u200b`);
    msg.channel.sendEmbed(embed);
  }


  static get messages() {
    const messages = ['Mami sagt immer, dass Leute in meinem Alter nicht mehr an ihrem Daumen nuckeln sollten.',
      'Gutes Spiel! Viel Erfolg euch allen weiterhin!',
      'Och bitte, Mama! Nur noch ein Match vor der Gutenachtgeschichte. Ups, fc.',
      'Ich fühle mich gerade sehr unbedeutend... drückt mich... bitte...',
      'Ich müsste eigentlich schon schlafen. Erzählt es ja nicht meiner Mama.',
      'Gutes Spiel, alle zusammen!',
      'Ich wünsche euch alles Gute.',
      'Holla! Das hat richtig Spaß gemacht. Klasse gespielt!',
      'Gut gespielt. Mein Kompliment an euch alle.',
      'Ach, ihr seid einfach die besten, Leute!',
      'Ich könnte jetzt wirklich eine Umarmung gebrauchen.',
      'Ich habe schon länger Probleme wegen meines mengelnden Selbstvertrauens, aber danke, dass ihr alle so nett seid und mit mir spielt.'];
    return messages[Math.floor(Math.random() * messages.length)];
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 0,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'ggez',
      description: 'Versuch es doch!',
      shortdescription: '👀',
      usage: '$conf.prefixggezz',
    };
  }
};
