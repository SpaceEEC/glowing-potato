// https://euww.api.pvp.net/api/lol/euw/v1.3/summoner/by-name/RiotSchmick?api_key=<key>
// /api/lol/{region}/v1.3/stats/by-summoner/{summonerId}/summary
const { Command } = require('discord.js-commando');
const { RichEmbed: Embed } = require('discord.js');
const { stripIndents } = require('common-tags');
const request = require('superagent');

module.exports = class UrbanCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'league',
      group: 'miscellaneous',
      memberName: 'league',
      description: 'Display stats from league of legends.',
      guildOnly: true,
      args: [
        {
          key: 'search',
          prompt: 'what would you like to look up?',
          type: 'string',
        }
      ]
    });
  }

  hasPermission(msg) {
    return this.client.isOwner(msg.author.id);
  }

  async run(msg, args) {

  }
};
