module.exports = class Exec {
  constructor(bot) {
    this.bot = bot;
  }

  async run(msg, params = []) {
    if (msg.author.id === this.bot.config.ownerID) {
      const mes = await msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0x0800ff)
        .setDescription('Befehl wird ausgeführt...'));
      const exec = require('child_process');
      const time = +new Date;
      return exec.exec(params.join(' '), (error, stdout, stderr) => {
        if (error) {
          return mes.edit(`\`EXEC\`\n
\`\`\`xl\n${params.join(' ')}\n\`\`\`
${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
${error.stack ? `\`E-ROHR\`\n\`\`\`js\n${error.stack}\n\`\`\`` : ''}
${error.code ? `Error Code: ${error.code}` : ''}
${error.signal ? `Signal received: ${error.signal}` : ''}
`, {
  embed: new this.bot.methods.Embed()
                .setColor(0xffff00)
                .setDescription(`Befehl wurde mit Fehler(n) in \`${new Date().getTime() - time}\`ms ausgeführt.`),
});
        } else {
          return mes.edit(`\`EXEC\`
\`\`\`xl\n${params.join(' ')}\n\`\`\`
${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
${stderr ? `\`STERR\`\n\`\`\`xl\n${stderr}\`\`\`` : ''}
`, {
  embed: new this.bot.methods.Embed()
                .setColor(0x00ff08)
                .setDescription(`Befehl wurde erfolgreich in \`${new Date().getTime() - time}\`ms ausgeführt.`),
});
        }
      });
    } else {
      return msg.channel.sendEmbed(new this.bot.methods.Embed()
        .setColor(0xff0000)
        .setDescription('Du solltest nicht einmal hier angekommen sein.'));
    }
  }


  static get conf() {
    return {
      spamProtection: false,
      enabled: true,
      aliases: [],
      permLevel: 12,
      group: __dirname.split(require('path').sep).pop()
    };
  }


  static get help() {
    return {
      name: 'exec',
      shortdescription: 'Bash',
      description: 'Führt den angegebenen Befehl als Child_Process aus.',
      usage: '$conf.prefixexec [Befehl Argumente bla]',
    };
  }
};
