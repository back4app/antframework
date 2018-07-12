/**
 * @fileoverview Defines and exports the {@link Ant} class.
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const PluginController = require('./plugins/PluginController');

/**
 * Represents the main object for initializing and using the Ant Framework.
 * @example
 * <caption>Loading no config during initilization.</caption>
 * const ant = new Ant(); // Default config file will be used
 * @example
 * <caption>Loading an Array of plugins during initialization.</caption>
 * const ant = new Ant({
 *   plugins: [
 *     '/path/to/some/plugin/module',
 *     ['/path/to/another/plugin/module', pluginConfig],
 *     new MyPlugin()
 *   ]
 * });
 */
class Ant {
  /**
   * @param {Object} config The config settings to be loaded during the
   * framework initilization.
   * @param {Array<(string|Array<string,Object>|Plugin)>} config.plugins The
   * plugins to be loaded during the framework initialization.
   * @throws {Error} If the "config.plugins" param is not an Array.
   * @throws {Error} If initilization with no config and the default config file
   * cannot be read.
   */
  constructor(config) {
    if (config) {
      this._config = config;
    } else {
      this._loadDefaultConfig();
    }

    this._pluginController = new PluginController(this._config.plugins);
  }

  /**
  * Loads the default config file.
  * @throws {Error} If the default config file cannot be read.
  * @private
  */
  _loadDefaultConfig() {
    const defaultConfigPath = path.resolve(__dirname, 'defaultConfig.yml');
    try {
      this._config = yaml.safeLoad(fs.readFileSync(defaultConfigPath, 'utf8'));
    } catch (e) {
      throw new Error(
        `Could not load default config ${defaultConfigPath}: ${e}`
      );
    }
  }

  /**
   * Contains the {@link PluginController} instance created during the frameowrk
   * initilization.
   * @type {PluginController}
   * @readonly
   */
  get pluginController() {
    return this._pluginController;
  }

  /**
   * Creates a new service.
   * @param {!String} name The new service name.
   * @param {String} template The name of the template to be used during the new
   * service creation.
   * @throws {Error} If {@link Core} plugin is not loaded.
   * @async
   */
  async createService(name, template) {
    const core = this.pluginController.getPlugin('Core');
    if (!core) {
      throw new Error(
        'Service could not be created because the Core plugin is not loaded.'
      );
    } else {
      try {
        await core.createService(name, template);
      } catch(e) {
        throw new Error(`Service could not be created: ${e}`);
      }
    }
  }
}

module.exports = Ant;
