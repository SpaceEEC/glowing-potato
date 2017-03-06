const { Command } = require('discord.js-commando');

module.exports = class RemoveMusicCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'remove',
      aliases: ['splice'],
      group: 'music',
      memberName: 'remove',
      description: 'Shows the queue.',
      guildOnly: true,
      args: [
        {
          key: 'index',
          prompt: 'which song do you like to remove?\n',
          type: 'integer',
          min: 1,
        }
      ]
    });
  }

  hasPermission(msg) {
    const djRoles = msg.guild.settings.get('djRoles', []);
    if (!djRoles.length) return true;
    const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []), djRoles);
    return msg.member.roles.some(r => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    const queue = this.queue.get(msg.guild.id);
    if (!queue) {
      return msg.say('There is no queue, why not add some songs yourself?')
        .then((mes) => mes.delete(5000));
    }
    const song = queue[args.index];
    if (!song) {
      return msg.say('This entry wasn\'t found!')
        .then((mes) => mes.delete(5000));
    }

    const requestMessage = await msg.say(`Are you sure you want to skip this wonderful song?\n${song.title}\n\n__y__es/__n__o`);
    const response = (await requestMessage.channel.awaitMessages(m => m.author.id === msg.author.id, { maxMatches: 1, time: 30000 })).first();
    requestMessage.delete().catch(() => null);
    if (!response) {
      return msg.say('Aborting then.')
        .then((mes) => mes.delete(5000));
    }
    if (!['yes', 'y'].includes(response.content)) {
      return msg.say('Aborting then.')
        .then((mes) => mes.delete(5000));
    }

    queue.splice(queue.indexOf(song), 1);
    return msg.say(`What a shame, you forced me to remove this wonderful song from the queue:\`${song.title}\``)
      .then((mes) => mes.delete(5000));
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
