const { Command, FriendlyError } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const GuildConfig = require(require('path').join(__dirname, '..', '..', 'dataProviders', 'models', 'GuildConfig'));


module.exports = class MutedRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'mutedrole',
      group: 'adminstuff',
      memberName: 'mutedrole',
      description: 'Sets, creates or removes a \'Muted\' role for this guild.',
      guildOnly: true,
      args: [
        {
          key: 'action',
          prompt: stripIndents`You did not specify any option:
          If you want to create a new role, respond with \`create\`.
          If you want to update the channel overwrites for the already linked role, respond with \`update\`.
          If you want to specify an already existing role, respond with a \`@Mention\` or the \`ID\`.
          If you want to remove the already linked role, response with \`remove\`.
          If you want to display the current one, respond with whatever you want, **except** \`cancel\`.
          
          Creating a new role, chosing update or specifying a different one will automatically overwrite all channels.
          Removing a role will not remove it.\n\u200b`,
          type: 'string',
        }
      ]
    });

    // WTB better way of doing that without switch or a if else if chain.
    this.funcs = {
      create: this.create,
      update: this.update,
      remove: this.remove,
      specify: this.specify,
    };
  }

  hasPermission(msg) {
    const adminRoles = msg.guild.settings.get('adminRoles', []);
    return msg.member.roles.some(r => adminRoles.includes(r.id)) || msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
  }

  async run(msg, args) {
    const { id: guildID } = msg.guild;
    args.action = args.action.toLowerCase();

    let config = (await GuildConfig.findOrCreate({ where: { guildID } }))['0'].dataValues;

    if (this.funcs[args.action]) {
      config = await this.funcs[args.action].call(this, msg, config);
      if (config) await GuildConfig.update(config, { where: { guildID } });
      return;
    }

    {
      let mutedRole = args.action.match(/<@&(\d+)>/);
      mutedRole = mutedRole instanceof Array ? mutedRole[0] : args.action;
      if (msg.guild.roles.has(mutedRole)) {
        config = await this.funcs.specify(msg, config, mutedRole);
        if (config) await GuildConfig.update(config, { where: { guildID } });
        return;
      }
    }

    const mutedRole = msg.guild.roles.get(config.mutedRole);

    if (config.mutedRole && !mutedRole) {
      msg.say('The set up muted role was not found, removing it from config...');
      config.mutedRole = null;
      await GuildConfig.update(config, { where: { guildID } });
      return;
    }

    msg.say(config.mutedRole ? `The current muted role is \`@${mutedRole.name}\`` : 'No muted role set up.');
  }

  /**
   * Creates a new role if no one is present
   * @param {Message} msg The incoming message.
   * @param {Object} config The config to read from and write to.
   * @returns {Object|null} Returns the config if changes where made.
   */
  async create(msg, config) {
    if (config.mutedRole && msg.guild.roles.has(config.mutedRole)) {
      msg.say(stripIndents`There is already a role specified in the config.
      If you want to create a new role you have to \`remove\` the old first.
      Doing that only removes the overwrites and the config entry, the role itself wont be touched.
      If you want to specify a different role you can specify that with a \`@Mention\` or via the ID.`);
      return null;
    }
    const statusmessage = await msg.say('Creating role...');

    const roleID = (await msg.guild.createRole({ name: 'Muted', permissions: 0 })).id;
    config.mutedRole = roleID;

    await statusmessage.edit('Overwriting channel permissions, this may take a while...');
    const failed = await this.overwrite(msg.guild, roleID);

    statusmessage.edit(stripIndents`Role created${failed
      ? stripIndents`, but failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
      : ' and all overwrites set up!'}
      Also you maybe want to move the role up, be sure not to move the role higher than my highest role!`);
    return config;
  }

  /**
   * Updates the current role. Overwrites the permission in all channels.
   * Or removes it from the config if no longer present.
   * @param {Message} msg The incoming message.
   * @param {Object} config The config to update the role if necessary.
   * @returns {Object|null} Returns the config if changes where made.
   */
  async update(msg, config) {
    if (!config.mutedRole) {
      msg.say('There is no muted role set up!');
      return null;
    }
    if (!msg.guild.roles.has(config.mutedRole)) {
      msg.say('The role specified in the config could not be found, removing it from config...');
      config.mutedRole = null;
      return config;
    }
    const statusMessage = await msg.say('Overwriting channel permissions, this may take a while...');
    const failed = await this.overwrite(msg.guild, config.mutedRole, false);

    statusMessage.edit(stripIndents`${failed
      ? stripIndents`Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
      : 'All overwrites set up!'}`);
    return null;
  }

  /**
   * Updates the muted role or sets it.
   * @param {Message} msg The incoming message.
   * @param {Object} config The config to update the role and remove old overwrites from if possible.
   * @param {Role} role The new role to update the config and overwrites with.
   * @returns {Object|null} Returns the config if changes where made.
   */
  async specify(msg, config, role) {
    let statusMessage;
    if (config.mutedRole && msg.guild.roles.has(config.mutedRole)) {
      if (role === config.mutedRole) {
        msg.say(stripIndents`This is the current muted role.
        To update the overwrites please use the \`update\` option.`);
        return null;
      }
      statusMessage = await msg.say('Removing old overwrites, this may take a while...');
      await this.overwrite(msg.guild, config.mutedRole, true);
    }

    await statusMessage.edit('Overwriting channel permissions for new role, this may take a while...');
    const failed = await this.overwrite(msg.guild, config.mutedRole);
    config.mutedRole = role;

    statusMessage.edit(stripIndents`${failed
      ? stripIndents`Failed overwriting \`${failed}/${msg.guild.channels.size}\` channels.
      You might want to check if that is okay for you, or fix it yourself if not.`
      : `All overwrites set for \`@${role.name}\`!`}`);
    return config;
  }

  /**
   * Removes the current muted role and removes overwrites if possible.
   * The role itself wont be changed, just the overwrites and the entry in the config.
   * @param {Message} msg The incoming message.
   * @param {Object} config The config to remove the role from.
   * @returns {Object|null} Returns the config if changes where made.
   */
  async remove(msg, config) {
    if (!config.mutedRole) {
      msg.say('There is no muted role set up to remove!');
      return null;
    }
    if (!msg.guild.roles.has(config.mutedRole)) {
      msg.say('Removed the deleted muted role from the config.');
      config.mutedRole = null;
      return config;
    }
    const failed = await this.overwrite(msg.guild, config.mutedRole, true);

    msg.say(stripIndents`${failed
      ? stripIndents`Failed removing \`${failed}/${msg.guild.channels.size}\` channel overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\`!
      You might want to check if that is okay for you, or fix it yourself if not.`
      : stripIndents`Removed all overwrites for \`@${msg.guild.roles.get(config.mutedRole).name}\` and removed it from config!
      The role itself remains untouched.`}`);

    config.mutedRole = null;
    return config;
  }

  /**
   * Overwrites channel permissions or removes them.
   * @param {Guild} guild The guild object.
   * @param {Role|String} role The role to overwrite with or remove.
   * @param {Boolean} remove Whether remove or overwrite the channel permissions for that role.
   * @returns {Number} The number of failed overwrites.
   */
  async overwrite(guild, role, remove = false) {
    role = guild.roles.get(role);
    if (!role) throw new FriendlyError('the specified role is invalid!');
    let failed = 0;
    for (const channel of guild.channels.values()) {
      const overwrites = channel.permissionOverwrites.get(role.id);
      if (remove) {
        if (overwrites) await overwrites.delete().catch(() => failed++);
        continue;
      }
      if (overwrites && overwrites.deny === 2048 && overwrites.allow === 0) continue;
      await channel.overwritePermissions(role, { SEND_MESSAGES: false })
        .catch(() => failed++);
    }
    return failed;
  }
};
