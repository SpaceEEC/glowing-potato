const { Command } = require('discord.js-commando');

module.exports = class StopMusicCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'stop',
      aliases: ['gtfo', 'stfu', 'sile'],
      group: 'music',
      memberName: 'stop',
      description: 'Stops the song, deletes the playlist and disconnects the bot.',
      guildOnly: true,
    });
  }

  hasPermission(msg) {
    const djRoles = msg.guild.settings.get('djRoles', []);
    if (!djRoles.length) return true;
    const roles = msg.guild.settings.get('adminRoles', []).concat(msg.guild.settings.get('modRoles', []), djRoles);
    return msg.member.roles.some(r => roles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg) {
    const queue = this.queue.get(msg.guild.id);

    if (!queue) return msg.say('What do you expect to stop? 👀');
    if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so I will continue playing.`);
    }

    const song = queue.songs[0];
    queue.songs = [];

    if (song.dispatcher) song.dispatcher.end('stop');

    return msg.say('Party is over! 🚪 👈');
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
