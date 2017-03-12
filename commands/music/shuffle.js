const { Command } = require('discord.js-commando');

module.exports = class ShuffleQueueCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'shuffle',
			group: 'music',
			memberName: 'shuffle',
			description: 'Shuffles the playlist.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 60
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

		if (!queue) {
			return msg.say('There is nothing to shuffle in this guild. Change that!')
				.then((mes) => mes.delete(5000));
		}
		const array = queue.songs.slice(1);

		let currentIndex = array.length;
		let temporaryValue;
		let randomIndex;
		while (currentIndex !== 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		array.splice(0, 0, queue.songs[0]);
		queue.songs = array;

		return msg.say('The queue has been shuffled.')
			.then((mes) => mes.delete(5000));
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};
