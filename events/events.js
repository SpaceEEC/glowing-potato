const fs = require('fs');
const events = Object.values(require('discord.js').Constants.Events);
const { join } = require('path');

const readFolder = () => {
	return new Promise((resolve, reject) => {
		fs.readdir(__dirname, (err, files) => {
			if (err) reject(err);
			else resolve(files);
		});
	});
};

exports.init = async (client) => {
	const files = (await readFolder()).filter((f) => events.includes(f.split('.')[0]));
	for (const file of files) client.on(file.split('.')[0], (...args) => require(join(__dirname, file)).run(client, ...args));
};

