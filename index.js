const Discord = require('discord.js');
const fs = require('fs-extra-promise');
const db = require('sqlite');
const moment = require('moment');
moment.locale('de');
require('moment-duration-format');
const bot = new Discord.Client();

// log stuff
bot.log = (msg) => { console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line
bot.err = (msg) => { console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${msg}`); }; // eslint-disable-line

// config and confs
bot.confs = new Discord.Collection();
bot.config = {};
db.open('./var/db.sqlite').then(() => {
  db.get('SELECT * FROM config').then((stuff) => {
    for (let key in stuff) {
      bot.config[key] = stuff[key];
    }
  });
  db.each('SELECT * FROM confs').then((guild) => {
    bot.log(`Lade Gilde ${guild.id} | ${guild.name}`);
    bot.confs.set(guild.id, guild);
  });
});

// commands and aliases
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
fs.readdirAsync('./commands/')
  .then((files) => {
    try {
      files = files.filter(f => f.slice(-3) === '.js');
      bot.log(`Lade insgesamt ${files.length} Befehle.`);
      files.forEach(f => {
        const props = require(`./commands/${f}`);
        bot.log(`Lade Befehl: ${props.help.name}`);
        bot.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
          bot.aliases.set(alias, props.help.name);
        });
      });
    } catch (e) {
      bot.err(e);
    }
  })
  .catch((e) => {
    bot.err(e);
  });


bot.on('message', (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type !== 'text') return;
  const conf = bot.confs.get(msg.guild.id);
  if (conf.ignChannel && conf.ignChannel.includes(msg.channel.id)) return;
  if (conf.ignUsers && conf.ignUsers.includes(msg.author.id)) return;
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
    cmd.run(bot, msg, params);
    /* bot.check.run(bot, msg, cmd)
      .then(() => {
        cmd.run(bot, msg, params);
      })
      .catch((reason) => {
        if (reason) {
          if (reason.stack) bot.err(reason.stack);
          msg.channel.sendMessage(reason);
        }
      });*/
  } else if (command === 'eval') {
    if (msg.author.id === bot.config.ownerID) {
      const time = +new Date;
      try {
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
  bot.fetchApplication().then(coa => {
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
  });
  bot.user.setGame(bot.config.game);
});


bot.login(JSON.parse(fs.readFileSync('./var/auth.json', 'utf8')).dtoken);

process.on('unhandledRejection', (err) => {
  console.error(`Uncaught Promise Error:\n${err.stack ? err.stack : err}`); // eslint-disable-line
});
