const Discord = require('discord.js');
const fs = require('fs-extra-promise');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();
bot.db = require('sqlite');

// log stuff
bot.log = (msg) => { console.log(`[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line
bot.err = (msg) => { console.error(`[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line

// config and confs
bot.confs = new Discord.Collection();
bot.config = {};
// bot.db is defined in ./internal/internal.js

// methods
bot.methods = {};
bot.methods.inspect = (obj, hidden = false, depth = 0) => require('util').inspect(obj, hidden, depth);
bot.methods.Embed = Discord.RichEmbed;
bot.methods.Collection = Discord.Collection;

// commands and aliases
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

// internal
bot.internal = require('./internal/internal.js');
bot.internal.auth = JSON.parse(fs.readFileSync('./var/auth.json', 'utf8'));
bot.internal.init(bot);

bot.on('message', async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === 'dm') {
    msg.channel.sendMessage("(ง'̀-'́)ง");
    return;
  }
  if (msg.channel.type !== 'text') return;
  const conf = bot.confs.get(msg.guild.id);
  if (conf.ignchannels && conf.ignchannels.includes(msg.channel.id)) return;
  if (conf.ignusers && conf.ignusers.includes(msg.author.id)) return;
  if (!msg.content.startsWith(conf.prefix) && !bot.config.prefixMention.test(msg.content)) return;
  let prefixLength = conf.prefix.length;
  if (bot.config.prefixMention.test(msg.content)) {
    prefixLength = bot.config.prefixMention.exec(msg.content)[0].length + 1;
  }
  const command = msg.content.slice(prefixLength).split(' ')[0].toLowerCase();
  const params = msg.content.slice(prefixLength).split(' ').slice(1).filter(a => a); // eslint-disable-line
  let cmd;
  if (bot.commands.has(command)) {
    cmd = bot.commands.get(command);
  } else if (bot.aliases.has(command)) {
    cmd = bot.commands.get(bot.aliases.get(command));
  }
  if (cmd) {
    msg.conf = conf;
    msg.cmd = command;
    bot.internal.checks.run(bot, msg, cmd)
      .then(() => {
        cmd.run(bot, msg, params);
      })
      .catch((reason) => {
        if (reason) {
          if (reason.stack) bot.err(reason.stack);
          msg.channel.sendMessage(reason);
        }
      });
  }
});


bot.once('ready', async () => {
  bot.config.prefixMention = new RegExp(`^<@!?${bot.user.id}>`);
  const app = await bot.fetchApplication();
  bot.log(`${app.name} bereit!`);
  /* bot.fetchApplication().then(coa => {
    bot.channels
      .get('257831397983518722')
      .sendMessage(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]
Walte über
\`${bot.users.size}\` Nutzer und
\`${bot.channels.size}\` Channeln aus
\`${bot.guilds.size}\` Servern.`);
    bot.log(`${coa.name}: Walte über ${bot.users.size} Nutzer,
     in ${bot.channels.size} Channeln von ${bot.guilds.size} Servern.`);
  }).catch(e => {
    bot.err(e);
  }); */
  bot.user.setGame(bot.config.game);
});


bot.on('guildMemberAdd', (member) => {
  if (member.user.id === bot.user.id) return;
  const conf = bot.confs.get(member.guild.id);
  if (!conf.joinmsg) return;
  const response = conf.joinmsg
    .split(':user:').join(member)
    .split(':server:').join(member.guild.name); // eslint-disable-line
  if (conf.logchannel) {
    if (!bot.channels.get(conf.logchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.logchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in logchannel(${conf.logchannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
  if (conf.anchannel) {
    if (!bot.channels.get(conf.anchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.anchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in anchannel(${conf.anchannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
});


bot.on('guildMemberRemove', (member) => {
  if (member.user.id === bot.user.id) return;
  const conf = bot.confs.get(member.guild.id);
  if (!conf.leavemsg) return;
  const response = conf.leavemsg
    .split(':user:').join(member)
    .split(':server:').join(member.guild.name); // eslint-disable-line
  if (conf.logchannel) {
    if (!bot.channels.get(conf.logchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.logchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in logchannel(${conf.logchannel}) auf (${member.guild.id}): ${member.guild.name}
${e.stack ? e.stack : e}`);
    });
  }
  if (conf.anchannel) {
    if (!bot.channels.get(conf.anchannel)
      .permissionsFor(member.guild.member(bot.user))
      .hasPermission('SEND_MESSAGES')) return;
    member.guild.channels.get(conf.anchannel).sendMessage(response).catch(e => {
      bot.err(`Fehler beim Schreiben in anchannel(${conf.anchannel}) auf (${member.guild.id}): ${member.guild.name}\n${e.stack ? e.stack : e}`);
    });
  }
});


bot.on('voiceStateUpdate', (oldMember, newMember) => {
  if (bot.internal.musik.has(newMember.guild.id) && newMember.guild.member(bot.user).voiceChannel) {
    if (newMember.guild.member(bot.user).voiceChannel.members.size === 1 && oldMember.voiceChannel.id === newMember.guild.member(bot.user).voiceChannel.id) {
      bot.internal.musik.get(newMember.guild.id)._emptyChannel(true);
    } else {
      bot.internal.musik.get(newMember.guild.id)._emptyChannel(false);
    }
  }
  if (newMember.user.bot) return;
  const conf = bot.confs.get(newMember.guild.id);
  if (!conf.vlogchannel) return;
  if (!bot.channels.get(conf.vlogchannel)
    .permissionsFor(newMember.guild.member(bot.user))
    .hasPermission('SEND_MESSAGES')) return;
  if (oldMember.voiceChannel !== newMember.voiceChannel) {
    let clr;
    let desc;
    // leave
    if (newMember.voiceChannel === undefined) {
      clr = 0xFF4500;
      desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} hat die Verbindung aus ${oldMember.voiceChannel.name} getrennt.`;
    } else if (oldMember.voiceChannel === undefined) {
      // join
      clr = 0x7CFC00;
      desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} hat sich in ${newMember.voiceChannel.name} eingeloggt.`;
    } else {
      // move
      clr = 3447003;
      desc = `[${moment().format('DD.MM.YYYY HH:mm:ss')}]: ${newMember.toString()} ging von ${oldMember.voiceChannel.name} zu ${newMember.voiceChannel.name}`;
    }
    bot.channels.get(conf.vlogchannel).sendEmbed({
      color: clr,
      author: {
        name: newMember.displayName,
        url: newMember.user.displayAvatarURL,
        icon_url: newMember.user.displayAvatarURL,
      },
      description: desc,
    });
  }
});


bot.on('guildCreate', (guild) => {
  const newguild = bot.confs.get('default');
  newguild.id = guild.id;
  newguild.name = guild.name;
  bot.confs.set(newguild.id, newguild);
  bot.db.run('INSERT INTO confs(id,name,prefix,ignchannels,ignusers,disabledcommands)'
    + 'VALUES (?,?,?,?,?,?);',
    [newguild.id, newguild.name, newguild.prefix, '[]', '[]', '[]']);
  bot.log(`Gilde (${guild.id}): ${guild.name} beigetreten!`);
});


bot.on('guildDelete', (guild) => {
  bot.confs.get(guild.id).delete();
  bot.db.run(`DELETE FROM confs WHERE id=${guild.id}`);
  bot.log(`Gilde (${guild.id}): ${guild.name} verlassen!`);
});


bot.on('disconnect', () => {
  bot.log(`Disconnected nach ${moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Minuten], s [Sekunden]')}.`); // eslint-disable-line
  // process.exit(100);
});


process.on('unhandledRejection', (err) => {
  bot.err(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
});


bot.login(bot.internal.auth.dtoken);
