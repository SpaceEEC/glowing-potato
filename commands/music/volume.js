const { Command } = require('discord.js-commando');

module.exports = class VolumeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'volume',
      group: 'music',
      memberName: 'volume',
      description: 'Sets the volume.',
      examples: [
        '`volume` Will display the current volume',
        '`volume 2` Will set the volume to 2.',
      ],
      args: [
        {
          key: 'volume',
          prompt: 'to which level would you like set the volume?\n',
          type: 'integer',
          min: 1,
          max: 10
        }
      ],
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
    const volume = parseInt(args.volume);
    const queue = this.queue.get(msg.guild.id);

    if (!queue) {
      return msg.say('The queue is empty, no need to change the volume.')
        .then((mes) => mes.delete(5000));
    }
    if (isNaN(volume)) {
      return msg.say(`The volume is \`${queue.volume}\`.`)
        .then((mes) => mes.delete(30000));
    }
    if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so the current volume will stay.`)
        .then((mes) => mes.delete(5000));
    }

    queue.volume = volume;
    if (queue.songs[0].dispatcher) queue.songs[0].dispatcher.setVolumeLogarithmic(volume / 5);
    return msg.say(`Volume is now \`${volume}\`.`)
      .then((mes) => mes.delete(5000));
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
