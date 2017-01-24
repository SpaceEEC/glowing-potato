exports.run = async (bot, msg, params = []) => {
  if (msg.author.id === bot.config.ownerID) {
    const time = +new Date;
    try {
      const code = params.join(' ');
      let evaled = eval(code);
      if (evaled instanceof Promise) evaled = await evaled;
      const response_typeof = typeof evaled;
      if (typeof evaled !== 'string') { evaled = require('util').inspect(evaled, false, 0); }
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

Ausführungszeitraum: \`${new Date().getTime() - time}\`ms`).catch((e) => {
          msg.channel.sendMessage(`Fehler beim Senden der Antwort:\n` + // eslint-disable-line
            `\`\`\`js
${e.stack ? e.stack : e}
\`\`\``);
        }); // eslint-disable-line
    } catch (e) {
      msg.channel.sendMessage(`\`E-ROHR\`
\`\`\`js
${e}
\`\`\`

Versuchungszeitraum: \`${new Date().getTime() - time}\`ms`);
    }
  } else {
    msg.channel.sendMessage('Du kannst den `eval` Befehl leider nicht verwenden.');
  }
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: [],
  permLevel: 12,
};


exports.help = {
  name: 'eval',
  shortdescription: 'eval()',
  description: 'Führt code in JavaScript aus.',
  usage: '$conf.prefixeval [👀]',
};
