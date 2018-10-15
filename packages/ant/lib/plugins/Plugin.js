/**
 * @fileoverview Defines and exports the {@link Plugin} class.
 */

const assert = require('assert');

/**
 * @class ant/Plugin
 * Represents a generic plugin for the Ant Framework.
 */
class Plugin {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is loading the
   * plugin.
   * @param {Object} config The plugin config settings.
   * @param {String} config.basePath The base path to be used by the plugin.
   * @throws {AssertionError} If the "ant" param is not passed.
   */
  constructor(ant, config) {
    assert(
      ant,
      'Could not initialize plugin: param "ant" is required'
    );
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize plugin: param "ant" should be Ant'
    );

    /**
     * Contains the {@link Ant} framework instance that loaded the plugin.
     * @type {Ant}
     * @private
     */
    this._ant = ant;

    /**
     * Contains the plugin config settings.
     * @type {Object}
     * @property {String} basePath The plugin base path.
     */
    this._config = config;
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
   * Contains the plugin templates to be used in the framework.
   * @type {Template[]}
   * @readonly
   */
  get templates() {
    return [];
  }

  /**
   * Contains the plugin runtimes to be used in the framework.
   * @type {Runtime[]}
   * @readonly
   */
  get runtimes() {
    return [];
  }

  /**
   * Contains the plugin functions to be used in the framework.
   * @type {AntFunction[]}
   * @readonly
   */
  get functions() {
    return [];
  }

  /**
   * Contains the plugin providers to be used in the framework.
   * @type {Provider[]}
   * @readonly
   */
  get providers() {
    return [];
  }

  /**
   * Loads the plugin's specific Yargs settings.
   * @param {Object} yargs The
   * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} object
   * to which the settings will be loaded.
   */
  loadYargsSettings() {}

  /**
   * Gets the default name for a specific plugin.
   * @param {!Object} plugin The plugin whose name will be gotten.
   * @return {string} The plugin default name.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of the
   * {@link Plugin} class.
   */
  static GetPluginDefaultName(plugin) {
    assert(
      plugin instanceof Plugin,
      'Could not get plugin name: param "plugin" should be Plugin'
    );
    return plugin.constructor.name;
  }
}

module.exports = Plugin;
