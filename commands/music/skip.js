const { Command } = require('discord.js-commando');

module.exports = class SkipMusicCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'skip',
      aliases: ['next'],
      group: 'music',
      memberName: 'skip',
      description: 'Skips the current song.',
      guildOnly: true,
      throttling: {
        usages: 1,
        duration: 30
      }
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

    if (!queue) return msg.say('Skipping with an empty queue? I don\'t think so. 👀');
    if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so no skipping for you.`);
    }

    const song = queue.songs[0];
    song.dispatcher.end('skip');

    return msg.say(`What a lame decision, skipped \`${song}}\`!`);
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
