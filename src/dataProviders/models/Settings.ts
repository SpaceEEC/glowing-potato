import { DataTypes, Model } from 'sequelize';
import sequelize from '../SQLite';

export default class Settings extends Model {
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
}, { sequelize });
