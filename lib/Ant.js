/**
 * @fileoverview Defines and exports the {@link Ant} class.
 */

const assert = require('assert');
const AntError = require('./util/AntError');
const PluginController = require('./plugins/PluginController');
const TemplateController = require('./templates/TemplateController');
const FunctionController = require('./functions/FunctionController');
const RuntimeController = require('./functions/runtimes/RuntimeController');
const HostController = require('./hosts/HostController');
const ProviderController = require('./hosts/providers/ProviderController');
const Core = require('./plugins/core/lib/Core');
const Config = require('./config/Config');

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
      Config.ParseConfigTemplates(
        this._globalConfig.templates,
        this._globalConfig.basePath
      ));

    if (this._config && this._config.templates) {
      this._templateController.loadTemplates(
        Config.ParseConfigTemplates(
          this._config.templates,
          this._config.basePath
        ));
    }

    /**
     * Contains the {@link RuntimeController} instance created during the
     * framework initialization.
     * @type {RuntimeController}
     * @private
     */
    this._runtimeController = new RuntimeController(this);

    /**
     * Contains the {@link FunctionController} instance created during the
     * framework initialization.
     * @type {FunctionController}
     * @private
     */
    this._functionController = new FunctionController(
      this,
      Config.ParseConfigFunctions(this._globalConfig.functions, this._runtimeController)
    );

    if (this._config && this._config.functions) {
      this._functionController.loadFunctions(
        Config.ParseConfigFunctions(this._config.functions, this._runtimeController)
      );
    }

    /**
     * Contains the {@link ProviderController} instance created during the
     * framework initialization.
     * @type {ProviderController}
     * @private
     */
    this._providerController = new ProviderController(this);

    /**
     * Contains the {@link HostController} instance created during the
     * framework initialization.
     * @type {HostController}
     * @private
     */
    this._hostController = new HostController(
      this,
      Config.ParseConfigHosts(this._globalConfig.hosts, this.providerController)
    );

    if (this._config && this._config.hosts) {
      this._hostController.loadHosts(
        Config.ParseConfigHosts(this._config.hosts, this.providerController)
      );
    }
  }

  /**
   * Contains the ant framework local configuration settings.
   * @type {Object}
   */
  get config() {
    return this._config;
  }

  /**
  * Gets the global config.
  * @returns {Object} Tbe global config.
  * @private
  */
  _getGlobalConfig() {
    return Config.Global.config;
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
   * Contains the {@link RuntimeController} instance created during the
   * framework initialization.
   * @type {RuntimeController}
   * @readonly
   */
  get runtimeController() {
    return this._runtimeController;
  }

  /**
   * Contains the {@link FunctionController} instance created during the
   * framework initialization.
   * @type {FunctionController}
   * @readonly
   */
  get functionController() {
    return this._functionController;
  }

  /**
   * Contains the {@link HostController} instance created during the
   * framework initialization.
   * @type {HostController}
   * @readonly
   */
  get hostController() {
    return this._hostController;
  }

  /**
   * Contains the {@link ProviderController} instance created during the
   * framework initialization.
   * @type {ProviderController}
   * @readonly
   */
  get providerController() {
    return this._providerController;
  }

  /**
   * Contains the service name.
   * @type {String}
   * @readonly
   */
  get service() {
    if (this.config) {
      return this.config.service || null;
    } else {
      return null;
    }
  }

  /**
   * Contains the Ant Framework's default runtime.
   * @type {BinFunction}
   * @readonly
   */
  get runtime() {
    return this.runtimeController.getRuntime('Default');
  }

  /**
   * Contains the Ant Framework's default host.
   * @type {Host}
   * @readonly
   */
  get host() {
    return this.hostController.getHost('Default');
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
    return await this._execCore(async (core) => {
      return await core.createService(name, template);
    }, 'Service could not be created');
  }

  /**
   * Deploys a service.
   * @throws {AssertionError} If {@link Core} plugin is not loaded.
   * @throws {AntError} If the Core plugin's createService method fails.
   * @async
   */
  async deployService() {
    return await this._execCore(async (core) => {
      return await core.deployService();
    }, 'Service could not be deployed');
  }

  /**
   * Adds a plugin.
   *
   * @param {!String} plugin The path to the plugin files
   * @param {Boolean} isGlobal Flag indicating it should be added
   * on the global configuration file
   * @returns {String} The path to the configuration file where the
   * plugin has been added.
   * @throws {AssertionError} If {@link Core} plugin is not loaded.
   * @throws {AntError} If the Core plugin's addPlugin method fails.
   * @async
   */
  async addPlugin(plugin, isGlobal) {
    return await this._execCore(async (core) => {
      return await core.addPlugin(plugin, isGlobal);
    }, 'Plugin could not be added');
  }

  /**
   * Removes a plugin.
   *
   * @param {!String} plugin The path of the plugin to be removed
   * @param {Boolean} isGlobal Flag indicating it should be removed
   * from the global configuration file
   * @returns {String} The path to the configuration file where the
   * plugin has been removed.
   */
  async removePlugin(plugin, isGlobal) {
    return await this._execCore(async (core) => {
      return await core.removePlugin(plugin, isGlobal);
    }, 'Plugin could not be removed');
  }

  /**
   * Adds a template into a configuration file.
   *
   * @param {!String} category The category of the template
   * @param {!String} template The name of the template to be added
   * @param {!String} templatePath The path to the template files
   * @param {Boolean} isGlobal True if should be added into global configuration,
   * false if it should be added into local configuration
   * @returns {String} The path of the added template
   * @throws {AntError} If any error is thrown in the process
   */
  async addTemplate(category, template, path, isGlobal) {
    return await this._execCore(async (core) => {
      return await core.addTemplate(category, template, path, isGlobal);
    }, 'Template could not be added');
  }

  /**
   * Removes a template from a configuration file
   *
   * @param {!String} category The category of the template
   * @param {!String} template The name of the template to be removed
   * @param {Boolean} isGlobal True if should be removed from global configuration,
   * false if it should be removed from local configuration
   * @returns {String} The path of the removed template
   * @throws {AntError} If any error is thrown in the process
   */
  async removeTemplate(category, template, isGlobal) {
    return await this._execCore(async (core) => {
      return await core.removeTemplate(category, template, isGlobal);
    }, 'Template could not be removed');
  }

  /**
   * Executes asynchronously the {@link Core#addFunction} function.
   * @see {@link Core#addFunction}
   *
   * @param {!String} name The name of the function to be added
   * @param {!String} func The path of the function
   * @param {BinFunction} runtime The runtime to run the function
   * @param {Boolean} isGlobal True if should be added into global configuration,
   * false if it should be added into local configuration
   * @returns {Promise} The async execution promise
   */
  async addFunction(name, func, runtime, isGlobal) {
    return await this._execCore(async core => {
      return await core.addFunction(name, func, runtime, isGlobal);
    });
  }

  /**
   * Executes asynchronously the {@link Core#addFunction} function.
   * @see {@link Core#removeFunction}
   *
   * @param {!String} name The name of the function to be removed
   * @param {Boolean} isGlobal True if should be removed from global configuration,
   * false if it should be removed from local configuration
   * @returns {Promise} The async execution promise
   */
  async removeFunction(name, isGlobal) {
    return await this._execCore(async core => {
      return await core.removeFunction(name, isGlobal);
    });
  }

  /**
   * Executes asynchronously the {@link Core#listFunctions} function.
   * @see {@link Core#listFunctions}
   *
   * @returns {Promise} The async execution promise
   */
  async listFunctions() {
    return await this._execCore(async core => {
      return await core.listFunctions();
    });
  }

  /**
   * Executes asynchronously the {@link Core#execFunction} function.
   * @see {@link Core#execFunction}
   *
   * @param {!String} name The name of the function to be executed
   * @param {Array} args The array of arguments to be provided to
   * the function
   * @returns {Promise} The async execution promise
   */
  async execFunction(name, args) {
    return await this._execCore(async core => {
      return await core.execFunction(name, args);
    });
  }

  /**
   * Wrapper function to execute any {@link Core} functions and handle
   * any error if thrown.
   * The "func" param will be invoked with a {@link Core} instance as
   * parameter.
   *
   * @param {!Function} func The function to be executed and handled
   * if any error is thrown.
   * @param {!String} errorMessage The message to be displayed when any errors
   * occurs.
   */
  async _execCore(func, errorMessage) {
    try {
      const core = this._getCoreModule();
      return await func(core);
    } catch (e) {
      throw new AntError(errorMessage, e);
    }
  }
}

module.exports = Ant;
