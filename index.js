const Discord = require('discord.js');
const fs = require('fs-extra-promise');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();
bot.db = require('sqlite');

// log stuff
bot.log = (msg) => { console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line
bot.err = (msg) => { console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line

// config and confs
bot.confs = new Discord.Collection();
bot.config = {};
bot.db.open('./var/db.sqlite').then(() => {
  bot.db.get('SELECT * FROM config').then((stuff) => {
    for (let key in stuff) {
      bot.config[key] = stuff[key];
    }
  });
  bot.db.all('SELECT * FROM confs').then((guilds) => {
    bot.log(`Lade insgesamt ${guilds.length} Gilden.`);
    for (let i = 0; i < guilds.length; i++) {
      const guild = guilds[i];
      bot.log(`Lade Gilde ${guild.id} | ${guild.name}`);
      try {
        guild.ignchannels = JSON.parse(guild.ignchannels);
        guild.ignusers = JSON.parse(guild.ignusers);
        guild.disabledcommands = JSON.parse(guild.disabledcommands);
      } catch (e) {
        bot.err(e.stack ? e.stack : e);
      }
      bot.confs.set(guild.id, guild);
    }
  });
});

// commands and aliases
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

// internal
bot.internal = {};
bot.internal.config = require('./internal/config.js');
bot.internal.commands = require('./internal/commands.js');
bot.internal.commands.init(bot).catch(bot.err);
bot.internal.checks = require('./internal/checks.js');
bot.internal.checks.check = new Discord.Collection();
bot.internal.checks.init(bot).catch(bot.err);

// methods
bot.methods = {};
bot.methods.Embed = Discord.RichEmbed;
bot.methods.Collection = Discord.Collection;


bot.on('message', (msg) => {
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

Ausgeführt in: \`${new Date().getTime() - time}\`ms`);
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


bot.once('ready', () => {
  bot.config.prefixMention = new RegExp(`^<@!?${bot.user.id}>`);
  bot.log('ready');
  /* bot.fetchApplication().then(coa => {
    bot.channels
      .get('257831397983518722')
      .sendMessage(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]
Walte über
\`${bot.users.size}\` Nutzer und
\`${bot.channels.size}\` Channeln aus
\`${bot.guilds.size}\` Servern.`);
    bot.log(`${coa.name}: Walte über ${bot.users.size} Nutzer, in ${bot.channels.size} Channeln von ${bot.guilds.size} Servern.`); // eslint-disable-line
  }).catch(e => {
    bot.err(e);
  }); */
  bot.user.setGame(bot.config.game);
});


bot.on('voiceStateUpdate', (oldMember, newMember) => {
  const conf = bot.confs.get(oldMember.guild.id);
  if (!conf.vlogChannel) return;
  if (!bot.channels.get(conf.vlogChannel)
    .permissionsFor(newMember.guild.member(bot.user))
    .hasPermission('SEND_MESSAGES')) return;
  if (oldMember.voiceChannel !== newMember.voiceChannel) {
    let clr;
    let desc;
    // leave
    if (newMember.voiceChannel === undefined) {
      clr = 0xFF4500;
      desc = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${newMember.user.toString()} hat die Verbindung aus ${oldMember.voiceChannel.name} getrennt.`; // eslint-disable-line
    } else if (oldMember.voiceChannel === undefined) {
      // join
      clr = 0x7CFC00;
      desc = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${newMember.user.toString()} hat sich in ${newMember.voiceChannel.name} eingeloggt.`; // eslint-disable-line
    } else {
      // move
      clr = 3447003;
      desc = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${newMember.user.toString()} ging von ${oldMember.voiceChannel.name} zu ${newMember.voiceChannel.name}`; // eslint-disable-line
    }
    bot.channels.get(conf.vlogChannel).sendEmbed({
      color: clr,
      author: {
        name: newMember.user.username,
        url: newMember.user.avatarURL ? newMember.user.avatarURL : bot.user.avatarURL,
        icon_url: newMember.user.avatarURL,
      },
      description: desc,
    });
  }
});


bot.on('disconnect', () => {
  bot.log(`Disconnected nach ${moment.duration(bot.uptime).format(' D [Tage], H [Stunden], m [Minuten], s [Sekunden]')}.`); // eslint-disable-line
  process.exit(100);
});


process.on('unhandledRejection', (err) => {
  console.error(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`); // eslint-disable-line
});

bot.login(JSON.parse(fs.readFileSync('./var/auth.json', 'utf8')).dtoken);
