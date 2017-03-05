const Sequelize = require('sequelize');

module.exports = class SQLite {
  constructor(db = 'settings.sqlite') {
    this.dataBase = new Sequelize('database', 'username', 'password', {
      host: 'localhost',
      dialect: 'sqlite',
      storage: db,
      logging: false,
    });
  }

  get db() {
    return this.dataBase;
  }
};
