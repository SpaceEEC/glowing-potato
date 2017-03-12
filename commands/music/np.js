const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const Song = require('../../structures/Song');

module.exports = class NowPlayingCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'np',
			aliases: ['song', 'playing'],
			group: 'music',
			memberName: 'np',
			description: 'Shows the current song.',
			guildOnly: true,
		});
	}

	async run(msg) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) {
			return msg.say('There is nothing going on in this guild. Add some songs!')
				.then((mes) => mes.delete(5000));
		}

		const song = queue.songs[0];
		const currentTime = song.dispatcher ? song.dispatcher.time / 1000 : 0;

		return msg.embed(new Embed().setColor(0x0800ff).setImage(song.thumbnail)
			.setAuthor(song.username, song.avatar)
			.setDescription(stripIndents`${queue.loop ? '**Queue is enabled!**\n' : ''}[${song.name}](${song.url})
    Currently at \`${Song.timeString(currentTime)}\`/\`${song.lengthString}\`
    ${song.playing ? '' : 'Currently paused.'}`))
			.then((mes) => mes.delete(30000));
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};
