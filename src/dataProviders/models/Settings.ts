import * as sequelize from 'sequelize';
import Database from '../SQLite';
const database: Database = new Database();

export class Settings extends sequelize.Model {
	public guild: string;
	public settings: string;
}

Settings.init({
	guild: {
		type: sequelize.DataTypes.STRING(20),
		allowNull: false,
		unique: true,
		primaryKey: true,
	},
	settings: { type: sequelize.DataTypes.STRING }
}, { sequelize: database.db });

Settings.sync();
