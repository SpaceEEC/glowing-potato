const { Command } = require('discord.js-commando');

module.exports = class VolumeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'volume',
      group: 'music',
      memberName: 'volume',
      description: 'Sets the volume.',
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
    args = parseInt(args);
    const queue = this.queue.get(msg.guild.id);

    if (!queue) return msg.say('The queue is empty, better add some songs to change the volume!');
    if (isNaN(args)) return msg.say(`The volume is \`${queue.volume}\`.`);
    if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so I wont change the volume.`);
    }

    const volume = args;
    if (volume > 10 || volume < 0) {
      return msg.say('Volumes goes from 1-10, my friend.');
    }
    queue.volume = volume;
    if (queue.songs[0].dispatcher) queue.songs[0].dispatcher.setVolumeLogarithmic(volume / 5);
    return msg.say(`Volume is now \`${volume}\`.`);
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
