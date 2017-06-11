import { DataTypes, FindOrInitializeOptions, Model } from 'sequelize';

import { sequelize } from '../SQLite';

type GuildConfigKey = 'guildID'
	| 'mutedRole'
	| 'vlogChannel'
	| 'logChannel'
	| 'anChannel'
	| 'joinMessage'
	| 'leaveMessage';

/**
 * Represents the Config for each specific guild
 * containing saved ids and messages.
 */
export class GuildConfig extends Model {
	/** Overrides Models findOrCreate, but only returns the model instance. */
	public static findOrCreate(options: FindOrInitializeOptions): any {
		return (super.findOrCreate(options) as any).then((instanceAndBool: [GuildConfig, boolean]) => instanceAndBool[0]);
	}

	public getDataValue(key: GuildConfigKey): string {
		return super.getDataValue(key);
	}

	public setDataValue(key: GuildConfigKey, value: string): void {
		return super.setDataValue(key, value);
	}

	/**
	 * Calls `setDataValue` and then `save`.
	 * @param {GuildConfigKey} key The key to set and save
	 * @param {string} value Their value
	 * @returns {Promise<this>}
	 */
	public setAndSave(key: GuildConfigKey, value: string): Promise<this> {
		super.setDataValue(key, value);
		return super.save() as any;
	}

	/** ID of the guild this config belongs to */
	public get guildID(): string {
		return super.getDataValue('guildID');
	}

	public set guildID(value: string) {
		super.setDataValue('guildID', value);
	}

	/** The ID of the muted role */
	public get mutedRole(): string {
		return super.getDataValue('mutedRole');
	}

	public set mutedRole(value: string) {
		super.setDataValue('mutedRole', value);
	}

	/**
	 * The ID of the channel for the
	 * voice channel movements
	 */
	public get vlogChannel(): string {
		return super.getDataValue('vlogChannel');
	}

	public set vlogChannel(value: string) {
		super.setDataValue('vlogChannel', value);
	}

	/**
	 * The ID of the channel
	 * for regular logging stuff
	 */
	public get logChannel(): string {
		return super.getDataValue('logChannel');
	}

	public set logChannel(value: string) {
		super.setDataValue('logChannel', value);
	}

	/**
	 * The ID of the channel
	 * for announcements, like
	 * a new member or a left member
	 */
	public get anChannel(): string {
		return super.getDataValue('anChannel');
	}

	public set anChannel(value: string) {
		super.setDataValue('anChannel', value);
	}

	/**
	 * The message for joining
	 * members to be send to the
	 * anChannel and logChannel
	 * if these are specified
	 */
	public get joinMessage(): string {
		return super.getDataValue('joinMessage');
	}

	public set joinMessage(value: string) {
		super.setDataValue('joinMessage', value);
	}

	/**
	 * The message for leaving
	 * members to be send to the
	 * anChannel and logChannel
	 * if these are specified
	 */
	public get leaveMessage(): string {
		return super.getDataValue('leaveMessage');
	}

	public set leaveMessage(value: string) {
		super.setDataValue('leaveMessage', value);
	}
}

GuildConfig.init({
	guildID: {
		allowNull: false,
		primaryKey: true,
		type: DataTypes.STRING(20),
		unique: true,
	},
	// tslint:disable-next-line:object-literal-sort-keys
	anChannel: { type: DataTypes.STRING(20) },
	joinMessage: { type: DataTypes.STRING(1800) },
	leaveMessage: { type: DataTypes.STRING(1800) },
	logChannel: { type: DataTypes.STRING(20) },
	mutedRole: { type: DataTypes.STRING(20) },
	vlogChannel: { type: DataTypes.STRING(20) },
}, { sequelize });

GuildConfig.sync();
