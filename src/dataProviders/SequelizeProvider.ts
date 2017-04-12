import { Guild } from 'discord.js';
import { Command, CommandGroup, CommandMessage, CommandoClient, SettingProvider } from 'discord.js-commando';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Settings from './models/Settings';

export default class SequelizeProvider extends SettingProvider {
	private db: Sequelize;
	private settings: Map<string, string | object | Array<any>>;
	private listeners: Map<string, Function>;
	private client: any;

	constructor(db: Sequelize) {
		super();
		this.db = db;
		this.settings = new Map();
		this.listeners = new Map();
	}

	public async init(client: CommandoClient): Promise<void> {
		this.client = client;
		await this.db.sync();

		const rows: Settings[] = await Settings.findAll() as Settings[];
		for (const row of rows) {
			let settings: any;
			try {
				settings = JSON.parse(row.settings);
			} catch (err) {
				client.emit('warn', `SequelizeProvider couldn't parse the settings stored for guild ${row.guild}.`);
				continue;
			}
			const guild: string = row.guild === '0' ? 'global' : row.guild;
			if (guild !== 'global' && !client.guilds.has(row.guild)) continue;
			this.setupGuild(guild, settings);
		}

		this.listeners
			.set('commandPrefixChange', (guild: Guild, prefix: string) => this.set(guild, 'prefix', prefix))
			.set('commandStatusChange', (guild: Guild, command: Command, enabled: boolean) => this.set(guild, `cmd-${command.name}`, enabled))
			.set('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) => this.set(guild, `grp-${group.name}`, enabled))
			.set('guildCreate', (guild: Guild) => {
				const settings: any = this.settings.get(guild.id);
				if (!settings) return;
				this.setupGuild(guild.id, settings);
			})
			.set('commandRegister', (command: Command) => {
				for (const [guild, settings] of this.settings) {
					if (guild !== 'global' && !client.guilds.has(guild)) continue;
					this.setupGuildCommand(client.guilds.get(guild), command, settings);
				}
			})
			.set('groupRegister', (group: CommandGroup) => {
				for (const [guild, settings] of this.settings) {
					if (guild !== 'global' && !client.guilds.has(guild)) continue;
					this.setupGuildGroup(client.guilds.get(guild), group, settings);
				}
			});
		for (const [event, listener] of this.listeners) client.on(event, listener);
	}

	public async destroy(): Promise<void> {
		// remove all listeners from the client
		for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
		this.listeners.clear();
	}

	public get(guild: string | Guild, key: string, defVal: any): any {
		const settings: any = this.settings.get((this.constructor as any).getGuildID(guild));
		return settings ? typeof settings[key] !== 'undefined' ? settings[key] : defVal : defVal;
	}

	public async set(guild: string | Guild, key: string, val: any): Promise<any> {
		guild = (this.constructor as any).getGuildID(guild) as string;
		let settings: any = this.settings.get(guild);
		if (!settings) {
			settings = {};
			this.settings.set(guild, settings);
		}

		settings[key] = val;
		await Settings.upsert({ guild: guild !== 'global' ? guild : '0', settings: JSON.stringify(settings) });
		if (guild === 'global') this.updateOtherShards(key, val);
		return val;
	}

	public async remove(guild: string | Guild, key: string): Promise<any> {
		guild = (this.constructor as any).getGuildID(guild) as string;
		const settings: any = this.settings.get(guild);
		if (!settings || typeof settings[key] === 'undefined') return undefined;

		const val: any = settings[key];
		settings[key] = undefined;
		await Settings.upsert({ guild: guild !== 'global' ? guild : '0', settings: JSON.stringify(settings) });
		if (guild === 'global') this.updateOtherShards(key, undefined);
		return val;
	}

	public async clear(guild: string | Guild): Promise<void> {
		guild = (this.constructor as any).getGuildID(guild) as string;
		if (!this.settings.has(guild)) return;
		this.settings.delete(guild);
		await Settings.destroy({ where: { guild: guild !== 'global' ? guild : '0' } });
	}
	private setupGuild(guild: any, settings: any): void {
		if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
		guild = this.client.guilds.get(guild) || null;

		// load the command prefix
		if (typeof settings.prefix !== 'undefined') {
			if (guild) guild._commandPrefix = settings.prefix;
			else this.client._commandPrefix = settings.prefix;
		}

		// load all command/group statuses
		for (const command of this.client.registry.commands.values()) this.setupGuildCommand(guild, command, settings);
		for (const group of this.client.registry.groups.values()) this.setupGuildGroup(guild, group, settings);
	}

	private setupGuildCommand(guild: any, command: any, settings: any): void {
		if (typeof settings[`cmd-${command.name}`] === 'undefined') return;
		if (guild) {
			if (!guild._commandsEnabled) guild._commandsEnabled = {};
			guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`];
		} else {
			command._globalEnabled = settings[`cmd-${command.name}`];
		}
	}

	private setupGuildGroup(guild: any, group: any, settings: any): void {
		if (typeof settings[`grp-${group.name}`] === 'undefined') return;
		if (guild) {
			if (!guild._groupsEnabled) guild._groupsEnabled = {};
			guild._groupsEnabled[group.name] = settings[`grp-${group.name}`];
		} else {
			group._globalEnabled = settings[`grp-${group.name}`];
		}
	}

	private updateOtherShards(key: string, val: any): void {
		if (!this.client.shard) return;
		key = JSON.stringify(key);
		val = typeof val !== 'undefined' ? JSON.stringify(val) : 'undefined';
		this.client.shard.broadcastEval(`
			if(this.shard.id !== ${this.client.shard.id} && this.provider && this.provider.settings) {
				this.provider.settings.global[${key}] = ${val};
			}
		`);
	}
};
