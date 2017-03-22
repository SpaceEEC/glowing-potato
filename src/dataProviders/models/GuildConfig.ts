import * as sequelize from 'sequelize';
import Database from '../SQLite';
const database: Database = new Database();

/**
 * Represents the Config for each specific guild
 * containing saved ids and messages.
 */
export class GuildConfig extends sequelize.Model {
	/**
 	* ID of the guild this config belongs to.
 	*/
	public guildID: string;
	/**
	 * The ID of the muted role.
	 */
	public mutedRole: string;
	/**
	 * The ID of the channel for the
	 * voice channel movements.
	 */
	public vlogChannel: string;
	/**
	 * The ID of the channel
	 * for regular logging stuff.
	 */
	public logChannel: string;
	/**
	 * The ID of the channel
	 * for announcements, like
	 * a new member or a left member.
	 */
	public anChannel: string;
	/**
	 * The message for joining
	 * members to be send to the
	 * anChannel and logChannel
	 * if these are specified.
	 */
	public joinMessage: string;
	/**
	 * The message for leaving
	 * members to be send to the
	 * anChannel and logChannel
	 * if these are specified.
	 */
	public leaveMessage: string;

};

GuildConfig.init({
	guildID: {
		type: sequelize.DataTypes.STRING(20),
		allowNull: false,
		unique: true,
		primaryKey: true,
	},
	mutedRole: { type: sequelize.DataTypes.STRING(20) },
	vlogChannel: { type: sequelize.DataTypes.STRING(20) },
	logChannel: { type: sequelize.DataTypes.STRING(20) },
	anChannel: { type: sequelize.DataTypes.STRING(20) },
	joinMessage: { type: sequelize.DataTypes.STRING(1800) },
	leaveMessage: { type: sequelize.DataTypes.STRING(1800) },
}, { sequelize: database.db });

GuildConfig.sync();