import * as sequelize from 'sequelize';

export default new (sequelize as any)('database', 'username', 'password', {
	dialect: 'sqlite',
	host: 'localhost',
	logging: false,
	storage: '../settings.sqlite',
}) as sequelize.Sequelize;
