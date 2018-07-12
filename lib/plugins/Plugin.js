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
    return Plugin.GetPluginDefaultName(this);
  }

  /**
   * Loads the plugin's specific Yargs settings.
   * * @param {Object} yargs The
   * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} object
   * to which the settings will be loaded.
   */
  loadYargsSettings() {}

  /**
   * Gets the default name for a specific plugin.
   * @param {!Object} plugin The plugin whose name will be gotten.
   * @return {string} The plugin default name.
   * @throws {Error} If the passed "plugin" param is not an instance of the
   * {@link Plugin} class.
   */
  static GetPluginDefaultName(plugin) {
    if (!(plugin instanceof Plugin)) {
      throw new Error(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    }
    return plugin.constructor.name;
  }
}

module.exports = Plugin;
