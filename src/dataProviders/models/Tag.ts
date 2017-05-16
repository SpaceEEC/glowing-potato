import { DataTypes, Model } from 'sequelize';

import sequelize from '../SQLite';

type TagKey = 'userID' | 'guildID' | 'name' | 'content';

/**
 * Represents a tag.
 */
export default class Tag extends Model {
	public getDataValue(key: TagKey): string {
		return super.getDataValue(key);
	}

	public setDataValue(key: TagKey, value: string): void {
		return super.setDataValue(key, value);
	}

	/**
	 * Calls `setDataValue` and then `save`.
	 * @param {GuildConfigKey} key The key to set and save
	 * @param {string} value Their value
	 * @returns {Promise<this>}
	 */
	public setAndSave(key: TagKey, value: string): Promise<this> {
		super.setDataValue(key, value);
		return super.save() as any;
	}

	/** The author's ID */
	public get userID(): string {
		return super.getDataValue('userID');
	}

	public set userID(value: string) {
		super.setDataValue('userID', value);
	}

	/**
	 * The belonging guild's ID.
	 */
	public get guildID(): string {
		return super.getDataValue('guildID');
	}

	public set guildID(value: string) {
		super.setDataValue('guildID', value);
	}

	/** The name */
	public get name(): string {
		return super.getDataValue('name');
	}

	public set name(value: string) {
		super.setDataValue('name', value);
	}

	/** The content */
	public get content(): string {
		return super.getDataValue('content');
	}
	public set content(value: string) {
		super.setDataValue('content', value);
	}
}

Tag.init({
	userID: DataTypes.STRING(20),
	guildID: DataTypes.STRING(20),
	name: DataTypes.STRING,
	content: DataTypes.STRING(1800),
}, { sequelize });

Tag.sync();
