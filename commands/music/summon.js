const { Command } = require('discord.js-commando');
const winston = require('winston');

module.exports = class SummonCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'summon',
      aliases: ['overhere'],
      group: 'music',
      memberName: 'summon',
      description: 'Summons the bot to the current channel.',
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

    if (!queue) return msg.say('I am not playing, queue something up and I\'ll come automatically to you.');
    if (!msg.member.voiceChannel) return msg.say('Please explain me: How am I supposed to join you? You are not even in a voice channel!');
    if (queue.voiceChannel.members.has(msg.author.id)) {
      return msg.say('Trying to summon me, when we are already in the same channel, bravo.');
    }
    if (!queue.songs[0].dispatcher) return msg.say('I can only join you after the song started. Technical reasons.');

    const voiceChannel = msg.member.voiceChannel;

    if (!voiceChannel.joinable) {
      return msg.say('Your voice channel sure looks nice, but I unfortunately don\' have permissions to join it.\nBetter luck next time.');
    }
    if (!voiceChannel.speakable) {
      return msg.say('Your party looks nice I\'d love to join, but I am unfortunately not allowed to speak there, so I don\'t even join.');
    }

    const joinMessage = await msg.say('Joining your channel...');
    try {
      queue.connection = await voiceChannel.join();
      queue.voiceChannel = voiceChannel;
      return joinMessage.edit('Joined your channel, party will now continue here.');
    } catch (err) {
      winston.error(`[summon] [${msg.guild.id}]`, err);
      return msg.say('An error occurred while joining your channel.');
    }
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
