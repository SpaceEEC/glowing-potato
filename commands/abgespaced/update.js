exports.run = async (bot, msg, params = []) => { // eslint-disable-line
  const status_msg = await msg.channel.sendMessage('Starte Update...');
  const exec = require('child_process');
  exec.exec('git pull', async (error, stdout, stderr) => {
    if (error) {
      await status_msg.edit(`
\`INFO\`\n\`\`\`xl\n${stdout}\n\n${stderr}\`\`\`
${error.code ? `Exit Code: ${error.code}` : ''}
${error.signal ? `Signal erhalten: ${error.signal}` : ''}
`);
      process.exit(1335);
    } else {
      status_msg.edit(`
${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
Kein Fehler, dies bedeutet vermutlich kein Update.
Starte nicht automatisch neu.
    `).then(mes => {
      mes.delete(5000);
      msg.delete(5000);
    });
    }
  });
};


exports.conf = {
  spamProtection: false,
  enabled: true,
  aliases: ['bakaero'],
  permLevel: 0,
};


exports.help = {
  name: 'update',
  shortdescription: 'Updates',
  description: 'Updated den Bot halt',
  usage: '$conf.prefixupdate',
};
