import { DataTypes, Model } from 'sequelize';
import Database from '../SQLite';
const database: Database = new Database();

export class Settings extends Model {
	public guild: string;
	public settings: string;
}

Settings.init({
	guild: {
		type: DataTypes.STRING(20),
		allowNull: false,
		unique: true,
		primaryKey: true,
	},
	settings: { type: DataTypes.STRING }
}, { sequelize: database.db });

Settings.sync();
