const { Command } = require('discord.js-commando');

module.exports = class PauseMusicCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'pause',
			group: 'music',
			memberName: 'pause',
			description: 'Pauses the currently song.',
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
			return msg.say('Trying to pause without anything playing is certainly a smart move.')
				.then((mes) => mes.delete(5000));
		}
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.say(`I am playing over here in ${queue.voiceChannel.name}, you are not here, so why are you even trying to pause?`)
				.then((mes) => mes.delete(5000));
		}
		if (!queue.songs[0].dispatcher) {
			return msg.say('Pausing is only possible after the song started.')
				.then((mes) => mes.delete(5000));
		}
		if (!queue.songs[0].playing) {
			return msg.say('That song is already paused, you genius.')
				.then((mes) => mes.delete(5000));
		}

		queue.songs[0].dispatcher.pause();
		queue.songs[0].playing = false;

		return msg.say('Paused the song, be sure to finish it!')
			.then((mes) => mes.delete(5000));
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};
