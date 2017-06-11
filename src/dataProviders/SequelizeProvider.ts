import { Guild } from 'discord.js';
import { Command, CommandGroup, CommandoClient, GuildExtension, SettingProvider } from 'discord.js-commando';

import { Settings } from './models/Settings';

type Setting = string | object | any[];

export class SequelizeProvider extends SettingProvider {
	private settings: Map<string, Setting>;
	private listeners: Map<string, (...params: any[]) => any>;
	private client: CommandoClient;

	public constructor() {
		super();
		this.settings = new Map();
		this.listeners = new Map();
	}

	public async init(client: CommandoClient): Promise<void> {
		this.client = client;
		await Settings.sync();

		const rows: Settings[] = await Settings.findAll() as Settings[];
		for (const row of rows) {
			let settings: Setting;
			try {
				settings = JSON.parse(row.settings);
			} catch (err) {
				client.emit('warn', `SequelizeProvider couldn't parse the settings stored for guild ${row.guild}.`);
				continue;
			}
			const guild: string = row.guild === '0' ? 'global' : row.guild;

			this.settings.set(guild, settings);

			if (guild !== 'global' && !client.guilds.has(row.guild)) continue;
			this.setupGuild(guild, settings);
		}

		this.listeners
			.set('commandPrefixChange', (guild: Guild, prefix: string) => this.set(guild, 'prefix', prefix))

			.set('commandStatusChange', (guild: Guild, command: Command, enabled: boolean) =>
				this.set(guild, `cmd-${command.name}`, enabled))

			.set('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) =>
				this.set(guild, `grp-${group.name}`, enabled))

			.set('guildCreate', (guild: Guild) => {
				const settings: Setting = this.settings.get(guild.id);
				if (!settings) return;
				this.setupGuild(guild.id, settings);
			})

			.set('commandRegister', (command: Command) => {
				for (const [guild, settings] of this.settings) {
					if (guild !== 'global' && !client.guilds.has(guild)) continue;
					this.setupGuildCommand(client.guilds.get(guild) as GuildExtension, command, settings);
				}
			})

			.set('groupRegister', (group: CommandGroup) => {
				for (const [guild, settings] of this.settings) {
					if (guild !== 'global' && !client.guilds.has(guild)) continue;
					this.setupGuildGroup(client.guilds.get(guild) as GuildExtension, group, settings);
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
		const settings: any = this.settings.get((SettingProvider as any).getGuildID(guild));
		return settings ? typeof settings[key] !== 'undefined' ? settings[key] : defVal : defVal;
	}

	public async set(guild: string | Guild, key: string, val: any): Promise<any> {
		guild = (SettingProvider as any).getGuildID(guild) as string;
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
		guild = (SettingProvider as any).getGuildID(guild) as string;
		const settings: any = this.settings.get(guild);
		if (!settings || typeof settings[key] === 'undefined') return undefined;

		const val: any = settings[key];
		settings[key] = undefined;
		await Settings.upsert({ guild: guild !== 'global' ? guild : '0', settings: JSON.stringify(settings) });

		if (guild === 'global') this.updateOtherShards(key, undefined);
		return val;
	}

	public async clear(guild: string | Guild): Promise<void> {
		guild = (SettingProvider as any).getGuildID(guild) as string;
		if (!this.settings.has(guild)) return;

		this.settings.delete(guild);
		await Settings.destroy({ where: { guild: guild !== 'global' ? guild : '0' } });
	}
	private setupGuild(guild: GuildExtension | string, settings: Setting): void {
		if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
		guild = (this.client.guilds.get(guild) as any) || null;

		// load the command prefix
		if (typeof (settings as any).prefix !== 'undefined') {
			if (guild) (guild as any)._commandPrefix = (settings as any).prefix;
			else (this.client as any)._commandPrefix = (settings as any).prefix;
		}

		// load all command/group statuses
		for (const command of this.client.registry.commands.values()) {
			this.setupGuildCommand(guild as GuildExtension, command, settings);
		}

		for (const group of this.client.registry.groups.values()) {
			this.setupGuildGroup(guild as GuildExtension, group, settings);
		}
	}

	private setupGuildCommand(guild: GuildExtension, command: Command, settings: Setting): void {
		if (typeof (settings as any)[`cmd-${command.name}`] === 'undefined') return;

		if (guild) {
			if (!(guild as any)._commandsEnabled) (guild as any)._commandsEnabled = {};
			(guild as any)._commandsEnabled[command.name] = (settings as any)[`cmd-${command.name}`];
		} else {
			(command as any)._globalEnabled = (settings as any)[`cmd-${command.name}`];
		}
	}

	private setupGuildGroup(guild: GuildExtension, group: CommandGroup, settings: Setting): void {
		if (typeof (settings as any)[`grp-${group.name}`] === 'undefined') return;

		if (guild) {
			if (!(guild as any)._groupsEnabled) (guild as any)._groupsEnabled = {};
			(guild as any)._groupsEnabled[group.name] = (settings as any)[`grp-${group.name}`];
		} else {
			(group as any)._globalEnabled = (settings as any)[`grp-${group.name}`];
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
}
