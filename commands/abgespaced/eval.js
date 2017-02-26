module.exports = class Eval {
  constructor(bot) {
    const klasse = bot.commands.get(__filename.split(require('path').sep).pop().split('.')[0]);
    const statics = Object.getOwnPropertyNames(klasse).filter(prop => !['name', 'length', 'prototype'].includes(prop));
    for (const thing of statics) this[thing] = klasse[thing];
    this.bot = bot;
  }


  async run(msg, params = []) {
    if (msg.author.id === this.bot.config.ownerID) {
      const time = +new Date;
      const bot = this.bot;
      try {
        const code = params.join(' ');
        let evaled;
        if (msg.cmd === 'async') evaled = eval(`(async(bot,msg,params=[])=>{${code}})(bot,msg,params = []);`);
        else evaled = eval(code);
        if (evaled instanceof Promise) evaled = await evaled;
        const response_typeof = typeof evaled;
        if (typeof evaled !== 'string') { evaled = bot.inspect(evaled, false, 0); }
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
  msg.channel.sendMessage(`Fehler beim Senden der Antwort:\n
            \`\`\`js
${e.stack ? e.stack : e}
\`\`\``);
});
      } catch (e) {
        msg.channel.sendMessage(`\`E-ROHR\`
\`\`\`js
${e}${e.response && e.response.res && e.response.res.text ? `\n${e.response.res.text}` : ''}
\`\`\`

Versuchungszeitraum: \`${new Date().getTime() - time}\`ms`);
      }
    } else {
      msg.channel.sendMessage('Du kannst den `eval` Befehl leider nicht verwenden.');
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: ['async'],
      permLevel: 12,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'eval',
      shortdescription: 'eval()',
      description: 'Führt code in JavaScript aus.',
      usage: '$conf.prefixeval [👀]',
    };
  }
};
