/**
 * @fileoverview Defines and exports the {@link Ant} class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const AntError = require('./util/AntError');
const PluginController = require('./plugins/PluginController');
const TemplateController = require('./templates/TemplateController');
const Core = require('./plugins/core/lib/Core');
const configUtils = require('./util/config');

/**
 * Represents the main object for initializing and using the Ant Framework.
 * @example
 * <caption>Loading no config during initilization.</caption>
 * const ant = new Ant(); // Global config file will be used
 * @example
 * <caption>Loading an Array of plugins during initialization.</caption>
 * const ant = new Ant({ // It will be merged with global config
 *   plugins: [
 *     '/path/to/some/plugin/module',
 *     ['/path/to/another/plugin/module', pluginConfig],
 *     MyPlugin,
 *     [MyPlugin, myPluginConfig],
 *     new MyOtherPlugin(ant),
 *     { '/path/to/my/plugin': myPluginConfig }
 *   ]
 * });
 * @example <caption>Loading an Array of templates during initialization.</caption>
 * const ant = new Ant({
 *   templates: {
 *     Service: {
 *       MyTemplate : /path/to/my_template,
 *       MyOtherTemplate: /path/to/my_other_template
 *     },
 *     MyCustomCategory: {
 *       foo: /path/to/foo
 *     }
 *   }
 * });
 * </pre>
 */
class Ant {
  /**
   * @param {Object} config The config settings to be loaded during the
   * framework initilization.
   * @param {Array<(String|Array<String,Object>|Class|Array<Class,Object>
   * |Plugin|Object<String,Object>)>} config.plugins The
   * plugins to be loaded during the framework initialization.
   * @throws {AssertionError} If the "config.plugins" param is not an Array.
   * @throws {AntError} If the global config file cannot be read.
   */
  constructor(config) {
    /**
     * Contains the ant framework global configuration settings.
     * @type {Object}
     * @private
     */
    this._globalConfig = this._getGlobalConfig();

    /**
     * Contains the ant framework local configuration settings.
     * @type {Object}
     * @private
     */
    this._config = config;

    /**
     * Contains the {@link PluginController} instance created during the
     * framework initialization.
     * @type {PluginController}
     * @private
     */
    this._pluginController = new PluginController(
      this,
      this._globalConfig.plugins,
      this._globalConfig.basePath
    );

    if (this._config && this._config.plugins) {
      this._pluginController.loadPlugins(
        this._config.plugins,
        this._config.basePath
      );
    }

    /**
     * Contains the {@link TemplateController} instance created during the
     * framework initialization.
     * @type {TemplateController}
     * @private
     */
    this._templateController = new TemplateController(this,
      configUtils.parseConfigTemplates(
        this._globalConfig.templates,
        this._globalConfig.basePath
      ));

    if (this._config && this._config.templates) {
      this._templateController.loadTemplates(
        configUtils.parseConfigTemplates(
          this._config.templates,
          this._config.basePath
        ));
    }
  }

  /**
  * Gets the global config.
  * @returns {Object} Tbe global config.
  * @throws {AntError} If the global config file cannot be read.
  * @private
  */
  _getGlobalConfig() {
    const globalConfigPath = path.resolve(__dirname, 'globalConfig.yml');
    let globalConfig = null;
    try {
      globalConfig = yaml.safeLoad(
        fs.readFileSync(globalConfigPath, 'utf8')
      );
    } catch (e) {
      throw new AntError(
        `Could not load global config ${globalConfigPath}`,
        e
      );
    }
    if (!globalConfig) {
      globalConfig = {};
    }
    if (!globalConfig.basePath) {
      globalConfig.basePath = __dirname;
    }
    return globalConfig;
  }

  /**
   * Loads the {@link Core} module using the {@link PluginController} and returns it.
   *
   * @throws {AssertionError} If core module loaded is not an instance of {@link Core}
   * @returns {Object} The {@link Core} module
   */
  _getCoreModule() {
    const core = this.pluginController.getPlugin('Core');
    assert(
      core instanceof Core,
      'Core plugin not found on PluginController'
    );
    return core;
  }

  /**
   * Contains the {@link PluginController} instance created during the framework
   * initialization.
   * @type {PluginController}
   * @readonly
   */
  get pluginController() {
    return this._pluginController;
  }

  /**
   * Contains the {@link TemplateController} instance created during the
   * framework initialization.
   * @type {TemplateController}
   * @readonly
   */
  get templateController() {
    return this._templateController;
  }

  /**
   * Creates a new service.
   * @param {!String} name The new service name.
   * @param {String} template The name of the template to be used during the new
   * service creation.
   * @returns {String} The path to the new service.
   * @throws {AssertionError} If {@link Core} plugin is not loaded.
   * @throws {AntError} If the Core plugin's createService method fails.
   * @async
   */
  async createService(name, template) {
    try {
      const core = this._getCoreModule();
      return await core.createService(name, template);
    } catch(e) {
      throw new AntError('Service could not be created', e);
    }
  }

  /**
   * Installs a plugin.
   *
   * @param {!String} plugin The path to the plugin files
   * @param {Boolean} isGlobal Flag indicating it should be installed
   * from the global configuration file
   * @returns {String} The path to the configuration file where the
   * plugin has been installed.
   * @throws {AssertionError} If {@link Core} plugin is not loaded.
   * @throws {AntError} If the Core plugin's installPlugin method fails.
   * @async
   */
  async installPlugin(plugin, isGlobal) {
    try {
      const core = this._getCoreModule();
      return await core.installPlugin(plugin, isGlobal);
    } catch(e) {
      throw new AntError('Plugin could not be installed', e);
    }
  }

  /**
   * Uninstalls a plugin.
   *
   * @param {!String} plugin The path of the plugin to be removed
   * @param {Boolean} isGlobal Flag indicating it should be removed
   * from the global configuration file
   * @returns {String} The path to the configuration file where the
   * plugin has been removed.
   */
  async removePlugin(plugin, isGlobal) {
    try {
      const core = this._getCoreModule();
      return await core.removePlugin(plugin, isGlobal);
    } catch(e) {
      throw new AntError('Plugin could not be removed', e);
    }
  }
}

module.exports = Ant;
