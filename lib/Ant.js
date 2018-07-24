/**
 * @fileoverview Defines and exports the {@link Ant} class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const PluginController = require('./plugins/PluginController');
const Template = require('./templates/Template');
const TemplateController = require('./templates/TemplateController');

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
 *     MyPlugin,
 *     [MyPlugin, myPluginConfig]
 *     new MyOtherPlugin()
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
   * |Plugin)>} config.plugins The
   * plugins to be loaded during the framework initialization.
   * @throws {Error} If the "config.plugins" param is not an Array.
   * @throws {Error} If initilization with no config and the default config file
   * cannot be read.
   */
  constructor(config) {
    /**
     * Contains the ant framework configuration settings.
     * @type {Object}
     * @private
     */
    this._config = config;

    if (!this._config) {
      this._loadDefaultConfig();
    }

    /**
     * Contains the {@link PluginController} instance created during the
     * framework initialization.
     * @type {PluginController}
     * @private
     */
    this._pluginController = new PluginController(this, this._config.plugins);

    /**
     * Contains the {@link TemplateController} instance created during the
     * framework initialization.
     * @type {TemplateController}
     * @private
     */
    this._templateController = new TemplateController(this,
      this._parseConfigTemplates(this._config.templates));
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
   * Parses the framework templates from the config file;
   *
   * @param {Object} templatesConfig An object with following structure:
   *   {
   *     <Category_Name>: {
   *       <Template_Name> : <Template_Path>,
   *       ...
   *     },
   *     ...
   *   }
   * @private
   */
  _parseConfigTemplates(templatesConfig) {
    const parsedTemplates = [];
    if (templatesConfig) {
      assert(typeof templatesConfig === 'object', 'Error while loading templates \
from Ant\'s config file. The "template" configuration should be an object!');

      // Iterates over categories found on the config file
      for (const category in templatesConfig) {
        const templates = templatesConfig[category];
        assert(typeof templates === 'object', 'Error while loading templates from \
Ant\'s config file: Template category value is not an object!');
        // Iterates over templates from current category
        for (const template in templates) {
          const path = templates[template];
          parsedTemplates.push(new Template(category, template, path));
        }
      }
    }
    return parsedTemplates;
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
        return await core.createService(name, template);
      } catch(e) {
        throw new Error(`Service could not be created: ${e}`);
      }
    }
  }
}

module.exports = Ant;
