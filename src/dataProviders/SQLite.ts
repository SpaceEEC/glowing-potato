import { Sequelize } from 'sequelize';
import * as Realize from 'sequelize';

export default class Database {
	private dataBase: Sequelize;

	constructor(db = 'settings.sqlite') {
		const sqlite: any = Realize;
		this.dataBase = new sqlite('database', 'username', 'password', {
			host: 'localhost',
			dialect: 'sqlite',
			storage: db,
			logging: false,
		});
	}
	get db(): Sequelize {
		return this.dataBase;
	}
};
