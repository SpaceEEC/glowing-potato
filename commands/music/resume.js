const { Command } = require('discord.js-commando');

module.exports = class ResumeMusicCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'resume',
      aliases: ['continue'],
      group: 'music',
      memberName: 'resume',
      description: 'Resumes the song.',
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

    if (!queue) {
      return msg.say('Sorry to disappoint you, but you can\'t resume an empty queue.')
        .then((mes) => mes.delete(5000));
    }
    if (!queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say(`I am over here in ${queue.voiceChannel.name}, either you come to me, or you summon me to you.`)
        .then((mes) => mes.delete(5000));
    }
    if (!queue.songs[0].dispatcher) {
      return msg.say('Resuming a not even yet started song, what a nice idea!')
        .then((mes) => mes.delete(5000));
    }
    if (queue.songs[0].playing) {
      return msg.say('Trying to resume a currently playing song? You are not the smartes one.')
        .then((mes) => mes.delete(5000));
    }

    queue.songs[0].dispatcher.resume();
    queue.songs[0].playing = true;

    return msg.say('Revived the party!')
      .then((mes) => mes.delete(5000));
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
