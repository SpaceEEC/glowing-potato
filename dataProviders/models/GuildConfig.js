const Sequelize = require('sequelize');
const Database = require('../SQLite.js');
const database = new Database();

const GuildConfig = database.db.define('guildConfig', {
  guildID: {
    type: Sequelize.STRING(20), // eslint-disable-line new-cap
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  mutedRole: { type: Sequelize.STRING(20) }, // eslint-disable-line new-cap
  vlogChannel: { type: Sequelize.STRING(20) }, // eslint-disable-line new-cap
  logChannel: { type: Sequelize.STRING(20) }, // eslint-disable-line new-cap
  anChannel: { type: Sequelize.STRING(20) }, // eslint-disable-line new-cap
  joinMessage: { type: Sequelize.STRING(1800) }, // eslint-disable-line new-cap
  leaveMessage: { type: Sequelize.STRING(1800) }, // eslint-disable-line new-cap
});

GuildConfig.sync();

module.exports = GuildConfig;

