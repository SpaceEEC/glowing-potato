const Sequelize = require('sequelize');
const Database = require('../SQLite.js');
const database = new Database();

const Tag = database.db.define('tags', {
  userID: Sequelize.STRING(20), // eslint-disable-line new-cap
  guildID: Sequelize.STRING(20), // eslint-disable-line new-cap
  name: Sequelize.STRING,
  content: Sequelize.STRING(1800), // eslint-disable-line new-cap
});

Tag.sync();

module.exports = Tag;
