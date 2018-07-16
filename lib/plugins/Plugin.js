/**
 * @fileoverview Defines and exports the {@link Plugin} class.
 */

/**
 * Represents a generic plugin for the Ant Framework.
 */
class Plugin {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is loading the
   * plugin.
   * @throws {Error} If the "ant" param is not passed.
   */
  constructor(ant) {
    if (!ant) {
      throw new Error('Could not initialize plugin: param "ant" is required');
    } else if (!(ant instanceof require('../Ant'))) {
      throw new Error(
        'Could not initialize plugin: param "ant" should be Ant'
      );
    }

    /**
     * Contains the {@link Ant} framework instance that loaded the plugin.
     * @type {Ant}
     * @private
     */
    this._ant = ant;
  }

  /**
   * Contains the {@link Ant} framework instance that loaded the plugin.
   * @type {Ant}
   * @readonly
   */
  get ant() {
    return this._ant;
  }

  /**
   * Contains the plugin name.
   * @type {String}
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
