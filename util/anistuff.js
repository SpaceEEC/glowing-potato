const { anilist } = require('../auth.json');
const { RichEmbed: Embed } = require('discord.js');
const request = require('superagent');

module.exports = class Anistuff {

	/**
	 * Updates the access token for the anilist API.
	 * @param {object} client - The client.
	 * @param {message} msg - The message to change on update.
	 * @param {object} aniSettings - The settings to compare the timestamp against.
	 * @returns {object} The new aniSettings.
	 */
	static async updateToken(client, msg, aniSettings) {
		if (aniSettings.expires <= Math.floor(Date.now() / 1000) + 300) {
			const statusMessage = await msg.embed(new Embed().setColor(0xffff00)
				.setDescription('The token expired, a new one will be requested.\nThis may take a while.'));
			const res = await request.post(`https://anilist.co/api/auth/access_token`)
				.send({
					grant_type: 'client_credentials',
					client_id: anilist.client_id,
					client_secret: anilist.client_secret,
				}).set('Content-Type', 'application/json');
			aniSettings = {
				token: res.body.access_token,
				expires: res.body.expires
			};
			client.settings.set('aniSettings', aniSettings);
			await statusMessage.edit({
				embed: new Embed().setColor(0x00ff08)
					.setDescription('Successfully requested a new token, proceeding with your request now.'),
			});
		}
		return aniSettings;
	}

	/**
	 * Formats the fuzzy dates provided from anilist. (Using timestamps is overrated)
	 * @param {number} input - The provided number, can be a string.
	 */
	static formatFuzzy(input) {
		input = input.toString();
		return `${input.substring(6, 8)}.${input.substring(4, 6)}.${input.substring(0, 4)}`;
	}
};

