import * as sequelize from 'sequelize';
import Database from '../SQLite';
const database: Database = new Database();

/**
 * Represents a tag.
 */
export class Tag extends sequelize.Model {
	/**
	 * The ID of the author of this tag.
	 */
	public userID: string;
	/**
	 * The ID of the guild where
	 * this tag belongs to
	 */
	public guildID: string;
	/**
	 * The name of this tag.
	 */
	public name: string;
	/**
	 * The content of this tag.
	 */
	public content: string;
};

Tag.init({
	userID: sequelize.DataTypes.STRING(20),
	guildID: sequelize.DataTypes.STRING(20),
	name: sequelize.DataTypes.STRING,
	content: sequelize.DataTypes.STRING(1800),
}, { sequelize: database.db });

Tag.sync();
