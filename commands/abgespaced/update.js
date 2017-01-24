exports.run = async (bot, msg, params = []) => { // eslint-disable-line
  const status_msg = await msg.channel.sendMessage('Starte Update...');
  const exec = require('child_process');
  exec.exec('git pull', async (error, stdout, stderr) => {
    if (error) {
      status_msg.edit(`
\`INFO\`\n\`\`\`xl\n${stdout}\n\n${stderr}\`\`\`
${error.code ? `Exit Code: ${error.code}` : ''}
${error.signal ? `Signal erhalten: ${error.signal}` : ''}
Update mit Fehlern ausgeführt, starte nicht automatisch neu...`);
    } else {
      await status_msg.edit(`
${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
${params[0] !== '--norestart' ? 'Starte automatisch neu damit das Update wirksam wird...' : ''}
    `);
      if (params[0] !== '--norestart') process.exit(1335);
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
