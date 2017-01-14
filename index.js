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
  const params = msg.content.slice(prefixLength).split(' ').slice(1);
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
  } else if (command === 'eval') {
    if (msg.author.id === bot.config.ownerID) {
      const time = +new Date;
      try {
        msg.conf = conf;
        msg.cmd = command;
        const code = params.join(' ');
        let evaled = eval(code);
        const response_typeof = typeof evaled;
        if (typeof evaled !== 'string') { evaled = require('util').inspect(evaled); }
        if (evaled.includes(bot.token)) {
          msg.channel.sendMessage('Was willst du damit anstellen? 👀.');
          return;
        }
        msg.channel.sendMessage(`\`code:\`
\`\`\`js\n${code ? code.split(`\``).join(`´`) : 'falsy'}\`\`\`
\`evaled\\returned:\`
\`\`\`js\n${evaled ? evaled.split(`\``).join(`´`) : 'falsy'}\`\`\`
\`typeof:\`
\`\`\`js\n${response_typeof}
\`\`\`

Ausgeführt in: \`${new Date().getTime() - time}\`ms`).catch((e) => {
            msg.channel.sendMessage(`Fehler beim Senden der Antwort:\n` + // eslint-disable-line
              `\`\`\`js
${e.stack ? e.stack : e}
\`\`\``);
          }); // eslint-disable-line
        return;
      } catch (e) {
        msg.channel.sendMessage(`\`E-ROHR\`
\`\`\`js
${e}
\`\`\`

Ausgeführt in: \`${new Date().getTime() - time}\`ms`);
        return;
      }
    } else {
      msg.channel.sendMessage('Du kannst den `eval` Befehl leider nicht verwenden.');
      return;
    }
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
    [newguild.id, newguild.name, newguild.prefix, newguild.ignchannels, newguild.ignusers, newguild.disabledcommands]);
  bot.log(`Gilde (${guild.id}): ${guild.name} beigetreten!`);
});


bot.on('guildDelete', (guild) => {
  bot.confs.get(guild.id).delete();
  bot.db.run(`DELETE FROM confs WHERE id=${guild.id}`);
  bot.log(`Gilde (${guild.id}): ${guild.name} verlassen!`);
});


bot.on('disconnect', () => {
  bot.log(`Disconnected nach ${moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Minuten], s [Sekunden]')}.`); // eslint-disable-line
  process.exit(100);
});


process.on('unhandledRejection', (err) => {
  bot.err(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`);
});

bot.login(bot.internal.auth.dtoken);
