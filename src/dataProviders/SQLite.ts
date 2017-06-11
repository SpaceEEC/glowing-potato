import * as sqlize from 'sequelize';

export const sequelize: sqlize.Sequelize = new (sqlize as any)('database', 'username', 'password', {
	dialect: 'sqlite',
	host: 'localhost',
	logging: false,
	storage: '../settings.sqlite',
});
