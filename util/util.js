module.exports = class UtilClass {

  /**
   * Replaces parts of a string determined by the specified map or object.
   * @static
   * @param {string} input - The string that shall be replaced
   * @param {map|object} map - The map or object literal with keys and values to replace against.
   * @returns {string}
   */
  static replaceMap(input, map) {
    const regex = [];
    for (const key in map) {
      regex.push(key.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'));
    }
    return input.replace(new RegExp(regex.join('|'), 'g'), w => map[w]);
  }

  /**
   * Gets the used command (including aliases) from the message.
   * @static
   * @param {message} msg The message to get the used command from.
   * @param {?object} object The optional object, containing key and value pairs to replace matches.
   * @returns {string}
   */
  static getUsedAlias(msg, map = {}) {
    const alias = msg.content.slice(msg.guild.commandPrefix.length).split(' ')[0].toLowerCase();
    return map[alias] || alias;
  }

  /**
   * Returns either dataValues as an object or null if that row wasn't found.
   * @static
   * @param {model} model The model to be quieried from
   * @param {object} object The object to be specified in the .findOne()
   * @returns {null|object}
   */
  static async getValue(model, object) {
    const row = await model.findOne(object);
    if (!row) return null;
    else return row.dataValues;
  }
};

