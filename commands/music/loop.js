const { Command } = require('discord.js-commando');

module.exports = class ShuffleQueueCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'loop',
      group: 'music',
      memberName: 'loop',
      description: 'Songs will be appended to the queue after they finished, rather than just being deleted. ',
      guildOnly: true,
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
      return msg.say('There is nothing to be looped in this guild. Change that!')
        .then((mes) => mes.delete(5000));
    }
    if (!args) {
      return msg.say(`Looping is at the moment ${queue.loop ? 'enabled' : 'disabled'}.`)
        .then((mes) => mes.delete(5000));
    }

    if (['+', 'y', 'yes', 'enable', 'on', '1', 'true'].includes(args.split(' ')[0])) {
      if (queue.loop) {
        return msg.say('Looping is already enabled, my friend.')
          .then((mes) => mes.delete(5000));
      }
      queue.loop = true;
      return msg.say('Looping is now enabled!')
        .then((mes) => mes.delete(5000));
    } else if (['-', 'n', 'no', 'disable', 'off', '0', 'false'].includes(args.split(' ')[0])) {
      if (!queue.loop) {
        return msg.say('Looping is already disabled, my friend.')
          .then((mes) => mes.delete(5000));
      }
      queue.loop = false;
      return msg.say('Loopins is now disabled!')
        .then((mes) => mes.delete(5000));
    }

    return msg.say(`Looping is at the moment ${queue.loop ? 'enabled' : 'disabled'}.`)
      .then((mes) => mes.delete(5000));
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
