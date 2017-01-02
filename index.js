const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();



bot.login(JSON.parse(fs.readFileSync('./auth.json', 'utf8')));
