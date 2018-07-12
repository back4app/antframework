/**
 * @fileoverview Defines and exports the {@link PluginController} class.
 */

const Plugin = require('./Plugin');

/**
 * Represents a controller for the Ant Framework's plugins.
 * @example
 * <caption>Loading no plugins during initilization.</caption>
 * const pluginController = new PluginController();
 * @example
 * <caption>Loading an Array of plugins during initialization.</caption>
 * const pluginController = new PluginController([
 *   '/path/to/some/plugin/module',
 *   ['/path/to/another/plugin/module', pluginConfig],
 *   new MyPlugin()
 * ]);
 */
class PluginController {
  /**
   * @param {Array<(string|Array<string,Object>|Plugin)>} plugins The plugins to
   * be loaded during the controller initilization.
   * @throws {Error} If the "plugins" param is not an Array.
   */
  constructor(plugins) {
    /**
    * Contains the loaded plugins.
    * @type {Map}
    * @private
    */
    this._plugins = new Map();

    /**
    * Contains the erros generated during plugins loading.
    * @type {Error[]}
    * @private
    */
    this._loadingErrors = [];

    if (plugins) {
      this._loadPlugins(plugins);
    }
  }

  /**
   * Loads an Array of plugins.
   * @param {!Array<(string|Array<string,Object>|Plugin)>} plugins The plugins to
   * be loaded.
   * @throws {Error} If the passed "plugins" param is not an Array.
   * @private
   */
  _loadPlugins(plugins) {
    if (!(plugins instanceof Array)) {
      throw new Error(
        'Could not load plugins: param "plugins" should be Array'
      );
    }

    for (const plugin of plugins) {
      try {
        if (plugin instanceof Array) {
          this._loadPlugin(...plugin);
        } else {
          this._loadPlugin(plugin);
        }
      } catch (e) {
        this._loadingErrors.push(e);
      }
    }
  }

  /**
   * Loads a plugin.
   * @param {!(string|Plugin)} plugin The plugin to be loaded.
   * @param {Object} config The config Object to be used during the plugin
   * initilization.
   * @throws {Error} If the passed "plugin" param does not resolve to a valid
   * {@link Plugin}.
   * @private
   */
  _loadPlugin(plugin, config) {
    const originalPlugin = plugin;

    if (typeof plugin === 'string') {
      try {
        plugin = new (require(plugin))(config);
      } catch (e) {
        throw new Error(`Could not load plugin module "${plugin}": ${e}`);
      }

      if (!(plugin instanceof Plugin)) {
        throw new Error(
          `Could not load plugin module "${originalPlugin}": it should export a Plugin`
        );
      }
    } else if (!(plugin instanceof Plugin)) {
      throw new Error(
        'Could not load plugin: param "plugin" should be String or Plugin'
      );
    }

    const pluginName = this.getPluginName(plugin);

    if (this._plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already loaded`);
    }

    this._plugins.set(pluginName, plugin);
  }

  /**
   * Contains the laoded plugins
   * @type {Plugin[]}
   * @readonly
   */
  get plugins() {
    return Array.from(this._plugins.values());
  }

  /**
   * Contains the erros generated during plugins loading.
   * @type {string[]}
   * @readonly
   */
  get loadingErrors() {
    return this._loadingErrors;
  }

  /**
   * Gets a specific plugin name in a safe way.
   * @param {Plugin} plugin The plugin whose name will be gotten.
   * @return {string} The plugin name.
   * @throws {Error} If the passed "plugin" param is not an instance of the
   * {@link Plugin} class.
   */
  getPluginName(plugin) {
    if (!(plugin instanceof Plugin)) {
      throw new Error(
        'Could not get plugin name: param "plugin" should be Plugin'
      );
    }

    try {
      return plugin.name;
    } catch (e) {
      this._loadingErrors.push(new Error(`Could not get plugin name: ${e}`));
      return Plugin.GetPluginDefaultName(plugin);
    }
  }

  /**
   * Loads a specific plugin's Yargs settings in a safe way.
   * @param {Plugin} plugin The plugin whose Yargs settings will be loaded.
   * @param {Object} yargs The
   * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} object
   * to which the settings will be loaded.
   * @throws {Error} If the passed "plugin" param is not an instance of the
   * {@link Plugin} class.
   */
  loadPluginYargsSettings(plugin, yargs) {
    if (!(plugin instanceof Plugin)) {
      throw new Error(
        'Could not load plugin\'s Yargs settings: param "plugin" should be \
Plugin'
      );
    }

    try {
      plugin.loadYargsSettings(yargs);
    } catch (e) {
      this._loadingErrors.push(new Error(
        `Could not load ${this.getPluginName(plugin)} plugin's Yargs \
settings: ${e}`
      ));
    }
  }
}

module.exports = PluginController;
