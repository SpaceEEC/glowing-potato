const { Command, util } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const Song = require('../../structures/Song');

module.exports = class QueueCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'queue',
      aliases: ['songs', 'playlist', 'que', 'q'],
      group: 'music',
      memberName: 'queue',
      description: 'Shows the queue.',
      guildOnly: true,
      args: [
        {
          key: 'page',
          prompt: 'which page do you like to see?\n',
          type: 'integer',
          default: 1,
        }
      ]
    });
  }

  async run(msg, args) {
    const queue = this.queue.get(msg.guild.id);
    if (!queue) return msg.say('There is no queue, why not add some songs yourself?');

    const pages = util.paginate(queue.songs, args.page, 11);
    const currentSong = queue.songs[0];
    const currentTime = currentSong.dispatcher ? currentSong.dispatcher.time / 1000 : 0;

    let i = 0;
    let page = pages.items.map(song => `\`${i++}.\`[${song.name}](${song.url})`);

    const embed = new Embed().setColor(0x0800ff)
      .setTitle(`Queued up Songs: ${queue.songs.length} | Queue length: ${queue.songs.reduce((a, b) => a + b.length, 0)} (Blame YT)`)
      .setFooter(`Page ${args.page} of ${pages.maxPage}.`);

    if (args.page === 1) {
      page.splice(0, 1, stripIndents`${queue.loop ? '**Queue is enabled!**\n' : ''}${currentSong.playing ? '**Currently playing:**' : '**Currently paused**'}: ${Song.timeString(currentTime)}/${currentSong.lengthString}
      [${currentSong.name}](${currentSong.url})}${page.length !== 1 ? stripIndents`

      **Queue:**` : ''}`);
      embed.setThumbnail(currentSong.thumbnail);
    } else {
      page[0] = `${queue.loop ? '**Queue is enabled!**\n' : ''}${page[0]}}`;
    }
    page = page.join('\n');

    return msg.embed(embed.setDescription(stripIndents`${page}

    Use ${msg.usage()} to display a specific page`)
    );
  }

  get queue() {
    if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

    return this._queue;
  }
};
