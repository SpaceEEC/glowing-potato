import { DataTypes, Model } from 'sequelize';
import sequelize from '../SQLite';

export default class Settings extends Model {
	public guild: string;
	public settings: string;
}

Settings.init({
	guild: {
		allowNull: false,
		primaryKey: true,
		type: DataTypes.STRING(20),
		unique: true,
	},
	settings: { type: DataTypes.STRING },
}, { sequelize });
