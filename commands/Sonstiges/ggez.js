exports.run = (bot, msg, params = []) => { // eslint-disable-line no-unused-vars
  const embed = new bot.methods.Embed();
  embed
    .setAuthor(`${msg.member.displayName}:`, msg.author.displayAvatarURL)
    .setThumbnail(msg.author.displayAvatarURL)
    .setColor(msg.member.highestRole.color)
    .setTitle('\u200b')
    .setDescription(`**${messages[Math.floor(Math.random() * messages.length)]}**\n\u200b`);
  msg.channel.sendEmbed(embed);
};


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


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 0,
};


exports.help = {
  name: 'ggez',
  description: 'Versuch es doch!',
  shortdescription: '👀',
  usage: '$conf.prefixggezz',
};
