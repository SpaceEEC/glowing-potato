import * as sequelize from 'sequelize';

export default new (sequelize as any)('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: '../settings.sqlite',
	logging: false,
}) as sequelize.Sequelize;
