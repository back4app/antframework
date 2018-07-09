/**
 * @fileoverview Defines and exports the {@link Plugin} class.
 */

/**
 * Represents a generic plugin for the Ant Framework.
 */
class Plugin {
  /**
   * Contains the plugin name.
   * @type {string}
   * @readonly
   */
  get name() {
    return Plugin.getPluginDefaultName(this);
  }

  /**
   * Gets the default name for a specific plugin.
   * @param {!Object} plugin The plugin whose name will be gotten.
   * @return {string} The plugin default name.
   * @throws {Error} If the passed "plugin" param is not an Object.
   */
  static getPluginDefaultName(plugin) {
    if (!plugin) {
      throw new Error(
        'Could not get plugin name: param "plugin" should be Object'
      );
    }
    return plugin.constructor.name;
  }
}

module.exports = Plugin;
