const { Command } = require('discord.js-commando');
const { exec } = require('child_process');
const { stripIndents } = require('common-tags');

module.exports = class ExecuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'exec',
      aliases: ['doshit'],
      group: 'util',
      memberName: 'exec',
      description: 'Executes commands in bash.',
      guildOnly: true,
      guarded: true,
      args: [
        {
          key: 'code',
          prompt: 'what shall be executed?\n',
          type: 'string'
        }
      ]
    });
  }

  hasPermission(msg) {
    return this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    exec(args.code, (error, stdout, stderr) => {
      if (error) {
        return msg.say(
          stripIndents`\`EXEC\` ${error.code ? `\`Error Code: ${error.code}\`` : ''}\n
          \`\`\`xl\n${args.code}\n\`\`\`
          ${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
          ${error.stack ? `\`E-ROHR\`\n\`\`\`js\n${error.stack}\n\`\`\`` : ''}
          ${error.signal ? `Signal received: ${error.signal}` : ''}
          `);
      } else {
        return msg.say(
          stripIndents`
          \`EXEC\`
          \`\`\`xl\n${args.code}\n\`\`\`
          ${stdout ? `\`STDOUT\`\n\`\`\`xl\n${stdout}\`\`\`` : ''}
          ${stderr ? `\`STERR\`\n\`\`\`xl\n${stderr}\`\`\`` : ''}
          `);
      }
    });
  }

};
