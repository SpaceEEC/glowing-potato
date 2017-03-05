const { SettingProvider } = require('discord.js-commando');
const { Collection } = require('discord.js');

module.exports = class ExtendedSQLiteProvider extends SettingProvider {

  constructor(db) {
    super();
    this.db = db;
    Object.defineProperty(this, 'client', { value: null, writable: true });
    this.settings = new Map();
    this.listeners = new Map();
    this.tags = new Collection();
    this.insertOrReplaceStmt = null;
    this.deleteStmt = null;
    this.tagInsertStmt = null;
    this.tagUpdateStmt = null;
    this.tagDeleteStmt = null;
  }

  async init(client) {
    this.client = client;
    await this.db.run('CREATE TABLE IF NOT EXISTS settings (guild INTEGER PRIMARY KEY, settings TEXT)');
    await this.db.run('CREATE TABLE IF NOT EXISTS tags (guild INTEGER, author INTEGER, name TEXT, content TEXT);');

    // Load all settings
    const rows = await this.db.all('SELECT CAST(guild as TEXT) as guild, settings FROM settings');
    for (const row of rows) {
      let settings;
      try {
        settings = JSON.parse(row.settings);
      } catch (err) {
        client.emit('warn', `SQLiteProvider couldn't parse the settings stored for guild ${row.guild}.`);
        continue;
      }

      const guild = row.guild !== '0' ? row.guild : 'global';
      this.settings.set(guild, settings);
      if (guild !== 'global' && !client.guilds.has(row.guild)) continue;
      this.setupGuild(guild, settings);
    }

    // Load all tags
    const tags = await this.db.all('SELECT CAST(guild as TEXT) as guild, CAST(author as TEXT) as author, name, content FROM tags');
    for (const tag of tags) {
      this.tags.set(`${tag.guild}|${tag.name}`, { author: tag.author, name: tag.name, content: tag.content, });
    }

    // Prepare statements
    const statements = await Promise.all([
      this.db.prepare('INSERT OR REPLACE INTO settings VALUES(?, ?)'),
      this.db.prepare('DELETE FROM settings WHERE guild = ?'),
      this.db.prepare('INSERT INTO tags VALUES(?, ?, ?, ?)'),
      this.db.prepare('UPDATE tags SET content = ? WHERE guild = ? AND name = ?'),
      this.db.prepare('DELETE FROM tags WHERE guild = ? AND name = ?')
    ]);
    this.insertOrReplaceStmt = statements[0];
    this.deleteStmt = statements[1];
    this.tagInsertStmt = statements[2];
    this.tagUpdateStmt = statements[3];
    this.tagDeleteStmt = statements[4];

    // Listen for changes
    this.listeners
      .set('commandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix))
      .set('commandStatusChange', (guild, command, enabled) => this.set(guild, `cmd-${command.name}`, enabled))
      .set('groupStatusChange', (guild, group, enabled) => this.set(guild, `grp-${group.id}`, enabled))
      .set('guildCreate', guild => {
        const settings = this.settings.get(guild.id);
        if (!settings) return;
        this.setupGuild(guild.id, settings);
      })
      .set('commandRegister', command => {
        for (const [guild, settings] of this.settings) {
          if (guild !== 'global' && !client.guilds.has(guild)) continue;
          this.setupGuildCommand(client.guilds.get(guild), command, settings);
        }
      })
      .set('groupRegister', group => {
        for (const [guild, settings] of this.settings) {
          if (guild !== 'global' && !client.guilds.has(guild)) continue;
          this.setupGuildGroup(client.guilds.get(guild), group, settings);
        }
      });
    for (const [event, listener] of this.listeners) client.on(event, listener);
  }

  /**
   * Function for tag related db changes
   * @param {string} option - get || set || remove
   * @param {object} tag - { guild: ID, author: ID, name: string, content: string }
   */
  async tag(option, tag) {
    if (!option) throw new Error('No option specified');
    const { guild, author, name, content } = tag;
    if (option === 'get') {
      return this.tags.get(`${guild}|${name}`);
    } else if (option === 'set') {
      if (this.tags.has(`${guild}|${name}`)) {
        await this.tagUpdateStmt.run(content, guild, name);
      } else {
        await this.tagInsertStmt.run(guild, author, name, content);
      }
      this.tags.set(`${guild}|${name}`, { author, name, content, });
      return this.tags.get(`${guild}|${name}`);
    } else if (option === 'remove') {
      await this.tagDeleteStmt.run(guild, name);
      return this.tags.delete(`${guild}|${name}`);
    } else {
      throw new Error('Unexpected Option.');
    }
  }

  async destroy() {
    // Finalise prepared statements
    await Promise.all([
      this.insertOrReplaceStmt.finalize(),
      this.deleteStmt.finalize()
    ]);

    // Remove all listeners from the client
    for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
    this.listeners.clear();
  }

  get(guild, key, defVal) {
    const settings = this.settings.get(this.constructor.getGuildID(guild));
    return settings ? typeof settings[key] !== 'undefined' ? settings[key] : defVal : defVal;
  }

  async set(guild, key, val) {
    guild = this.constructor.getGuildID(guild);
    let settings = this.settings.get(guild);
    if (!settings) {
      settings = {};
      this.settings.set(guild, settings);
    }

    settings[key] = val;
    await this.insertOrReplaceStmt.run(guild !== 'global' ? guild : 0, JSON.stringify(settings));
    if (guild === 'global') this.updateOtherShards(key, val);
    return val;
  }

  async remove(guild, key) {
    guild = this.constructor.getGuildID(guild);
    const settings = this.settings.get(guild);
    if (!settings || typeof settings[key] === 'undefined') return undefined;

    const val = settings[key];
    settings[key] = undefined;
    await this.insertOrReplaceStmt.run(guild !== 'global' ? guild : 0, JSON.stringify(settings));
    if (guild === 'global') this.updateOtherShards(key, undefined);
    return val;
  }

  async clear(guild) {
    guild = this.constructor.getGuildID(guild);
    if (!this.settings.has(guild)) return;
    this.settings.delete(guild);
    await this.deleteStmt.run(guild !== 'global' ? guild : 0);
  }

	/**
	 * Loads all settings for a guild
	 * @param {string} guild - Guild ID to load the settings of (or 'global')
	 * @param {Object} settings - Settings to load
	 * @private
	 */
  setupGuild(guild, settings) {
    if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
    guild = this.client.guilds.get(guild) || null;

    // Load the command prefix
    if (typeof settings.prefix !== 'undefined') {
      if (guild) guild._commandPrefix = settings.prefix;
      else this.client._commandPrefix = settings.prefix;
    }

    // Load all command/group statuses
    for (const command of this.client.registry.commands.values()) this.setupGuildCommand(guild, command, settings);
    for (const group of this.client.registry.groups.values()) this.setupGuildGroup(guild, group, settings);
  }

	/**
	 * Sets up a command's status in a guild from the guild's settings
	 * @param {?Guild} guild - Guild to set the status in
	 * @param {Command} command - Command to set the status of
	 * @param {Object} settings - Settings of the guild
	 * @private
	 */
  setupGuildCommand(guild, command, settings) {
    if (typeof settings[`cmd-${command.name}`] === 'undefined') return;
    if (guild) {
      if (!guild._commandsEnabled) guild._commandsEnabled = {};
      guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`];
    } else {
      command._globalEnabled = settings[`cmd-${command.name}`];
    }
  }

	/**
	 * Sets up a group's status in a guild from the guild's settings
	 * @param {?Guild} guild - Guild to set the status in
	 * @param {CommandGroup} group - Group to set the status of
	 * @param {Object} settings - Settings of the guild
	 * @private
	 */
  setupGuildGroup(guild, group, settings) {
    if (typeof settings[`grp-${group.id}`] === 'undefined') return;
    if (guild) {
      if (!guild._groupsEnabled) guild._groupsEnabled = {};
      guild._groupsEnabled[group.id] = settings[`grp-${group.id}`];
    } else {
      group._globalEnabled = settings[`grp-${group.id}`];
    }
  }

	/**
	 * Updates a global setting on all other shards if using the {@link ShardingManager}.
	 * @param {string} key - Key of the setting to update
	 * @param {*} val - Value of the setting
	 * @private
	 */
  updateOtherShards(key, val) {
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
