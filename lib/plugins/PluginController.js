/**
 * @fileoverview Defines and exports the {@link PluginController} class.
 */

const assert = require('assert');
const path = require('path');
const { Observable } = require('rxjs');
const AntError = require('../util/AntError');
const Plugin = require('./Plugin');
const Template = require('../templates/Template');
const AntFunction = require('../functions/AntFunction');

/**
 * Represents a controller for the Ant Framework's plugins.
 * @example
 * <caption>Loading no plugins during initilization.</caption>
 * const pluginController = new PluginController(ant);
 * @example
 * <caption>Loading an Array of plugins during initialization.</caption>
 * const pluginController = new PluginController(ant, [
 *   '/path/to/some/plugin/module',
 *   ['/path/to/another/plugin/module', pluginConfig],
 *   MyPlugin,
 *   [MyPlugin, myPluginConfig],
 *   new MyOtherPlugin(ant),
 *   { '/path/to/my/plugin': myPluginConfig }
 * ]);
 */
class PluginController {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is loading the
   * plugin controller.
   * @param {Array<(String|Array<String,Object>|Class|Array<Class,Object>
   * |Plugin|Object<String,Object>)>} plugins The plugins to be loaded during
   * the controller initilization.
   * @param {String} basePath The base path for plugin modules.
   * @throws {AssertionError} If the "ant" param is not passed or the "plugins"
   * param is not an Array or the "basePath" param is not a String.
   */
  constructor(ant, plugins, basePath) {
    assert(
      ant,
      'Could not initialize the plugin controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize the plugin controller: param "ant" should be Ant'
    );

    /**
     * Contains the {@link Ant} framework instance that loaded the plugin
     * controller.
     * @type {Ant}
     * @private
     */
    this._ant = ant;

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

    /**
    * Contains the plugins observers.
    * @type {Set}
    * @private
    */
    this._pluginsObservers = new Set();

    /**
     * Contains an [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
     * of the loaded plugins.
     * @type {Observable<Plugin>}
     * @private
     */
    this._pluginsObservable = Observable.create(observer => {
      this._pluginsObservers.add(observer);

      for (const [, plugin] of this._plugins) {
        observer.next(plugin);
      }

      return () => {
        this._pluginsObservers.delete(observer);
      };
    });

    if (plugins) {
      this.loadPlugins(plugins, basePath);
    }
  }

  /**
   * Contains the {@link Ant} framework instance that loaded the plugin
   * controller.
   * @type {Ant}
   * @readonly
   */
  get ant() {
    return this._ant;
  }

  /**
   * Loads an Array of plugins.
   * @param {!Array<(String|Array<String,Object>|Class|Array<Class,Object>
   * |Plugin|Object<String,Object>)>} plugins The plugins to be loaded.
   * @param {String} basePath The base path for plugin modules.
   * @throws {AssertionError} If the passed "plugins" param is not an Array or
   * the passed "basePath" param is not a String.
   */
  loadPlugins(plugins, basePath) {
    assert(
      plugins instanceof Array,
      'Could not load plugins: param "plugins" should be Array'
    );

    assert(
      !basePath || typeof basePath === 'string',
      'Could not load plugins: param "basePath" should be String'
    );

    for (let plugin of plugins) {
      let config = null;
      if (plugin instanceof Array) {
        [plugin, config] = plugin;
      } else if (
        typeof plugin === 'object' &&
        !(plugin instanceof Plugin) &&
        Object.keys(plugin).length === 1
      ) {
        config = plugin[Object.keys(plugin)[0]];
        plugin = Object.keys(plugin)[0];
      }
      try {
        this.loadPlugin(plugin, config, basePath);
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
   * @param {String} basePath The base path for plugin modules.
   * @throws {AssertionError|AntError} If the passed "plugin" param does not
   * resolve to a valid {@link Plugin}.
   */
  loadPlugin(plugin, config, basePath) {
    const originalPlugin = plugin;

    if (basePath) {
      if (!config) {
        config = {};
      }
      if (!config.basePath) {
        config.basePath = basePath;
      }
    }

    if (typeof plugin === 'string') {
      try {
        const paths = [];
        if (basePath) {
          paths.push(basePath);
        }
        paths.push(process.cwd());
        paths.push(path.resolve(__dirname, '../../'));
        plugin = require.resolve(plugin, { paths });
        plugin = new (require(plugin))(this.ant, config);
      } catch (e) {
        throw new AntError(`Could not load plugin module "${plugin}"`, e);
      }

      assert(
        plugin instanceof Plugin,
        `Could not load plugin module "${originalPlugin}": it should export a
Plugin`
      );
    } else if (typeof plugin === 'function') {
      try {
        plugin = new plugin(this.ant, config);
      } catch (e) {
        throw new AntError(`Could not load plugin class "${plugin}"`, e);
      }

      assert(
        plugin instanceof Plugin,
        `Could not load plugin class "${originalPlugin.name}": it should be \
Plugin`
      );
    } else {
      assert(
        plugin instanceof Plugin,
        'Could not load plugin: param "plugin" should be String or Plugin'
      );
      assert.equal(
        plugin.ant,
        this.ant,
        'Could not load plugin: the framework used to initialize the plugin is \
different to this controller\'s'
      );
    }

    this._plugins.set(this.getPluginName(plugin), plugin);

    for (const pluginsObserver of this._pluginsObservers) {
      pluginsObserver.next(plugin);
    }
  }

  /**
   * Contains the loaded plugins.
   * @type {Plugin[]}
   * @readonly
   */
  get plugins() {
    return Array.from(this._plugins.values());
  }

  /**
   * Contains the erros generated during plugins loading.
   * @type {Error[]}
   * @readonly
   */
  get loadingErrors() {
    return this._loadingErrors;
  }

  /**
   * Contains an [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
   * of the loaded plugins.
   * @type {Observable<Plugin>}
   * @readonly
   */
  get pluginsObservable() {
    return this._pluginsObservable;
  }

  /**
   * Gets a specific plugin by its name.
   * @param {String} name The name of the plugin to be gotten.
   * @return {Plugin} The plugin object.
   */
  getPlugin(name) {
    return this._plugins.get(name);
  }

  /**
   * Gets a plugin member value in a safe way.
   * @param {!Plugin} plugin The plugin whose member value will be gotten.
   * @param {!String} member The member whose value will be gotten from plugin.
   * @param {Function} assertionFunction The assertion function that can be
   * used to validate the gotten value.
   * @return {*} The member value.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of the
   * {@link Plugin} class.
   */
  getFromPlugin(plugin, member, assertionFunction) {
    assert(
      plugin instanceof Plugin,
      'Could not get from plugin: param "plugin" should be Plugin'
    );
    assert(
      typeof member === 'string',
      'Could not get from plugin: param "member" should be String'
    );
    assert(
      !assertionFunction || typeof assertionFunction === 'function',
      'Could not get from plugin: param "assertionFunction" should be Function'
    );
    try {
      const out = plugin[member];
      if (assertionFunction) {
        assertionFunction(out);
      }
      return out;
    } catch (e) {
      this._loadingErrors.push(new AntError(
        `Could not get "${member}" from plugin "${this.getPluginName(plugin)}"`,
        e
      ));
      return null;
    }
  }

  /**
   * Gets a specific plugin name in a safe way.
   * @param {!Plugin} plugin The plugin whose name will be gotten.
   * @return {String} The plugin name.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of
   * the {@link Plugin} class.
   */
  getPluginName(plugin) {
    assert(
      plugin instanceof Plugin,
      'Could not get plugin name: param "plugin" should be Plugin'
    );

    try {
      return plugin.name;
    } catch (e) {
      this._loadingErrors.push(new AntError('Could not get plugin name', e));
      return Plugin.GetPluginDefaultName(plugin);
    }
  }

  /**
   * Gets a specific plugin templates in a safe way.
   * @param {!Plugin} plugin The plugin whose templates will be gotten.
   * @return {Template[]} The plugin templates.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of
   * the {@link Plugin} class.
   */
  getPluginTemplates(plugin) {
    assert(
      plugin instanceof Plugin,
      'Could not get plugin templates: param "plugin" should be Plugin'
    );

    let pluginTemplates = [];
    try {
      pluginTemplates = plugin.templates;
    } catch (e) {
      this._loadingErrors.push(new AntError(
        `Could not get "${this.getPluginName(plugin)}" plugin templates`,
        e
      ));
    }

    pluginTemplates = pluginTemplates.filter((pluginTemplate) => {
      if (pluginTemplate instanceof Template) {
        return true;
      } else {
        this._loadingErrors.push(new AntError(
          `Could not load one of "${this.getPluginName(plugin)}" plugin \
templates: it is not a Template`
        ));
        return false;
      }
    });

    return pluginTemplates;
  }

  /**
   * Gets a specific plugin functions in a safe way.
   * @param {!Plugin} plugin The plugin whose functions will be gotten.
   * @return {Function[]} The plugin functions.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of
   * the {@link Plugin} class.
   */
  getPluginFunctions(plugin) {
    assert(
      plugin instanceof Plugin,
      'Could not get plugin functions: param "plugin" should be Plugin'
    );

    let pluginFunctions = [];
    try {
      pluginFunctions = plugin.functions;
    } catch (e) {
      this._loadingErrors.push(new AntError(
        `Could not get "${this.getPluginName(plugin)}" plugin functions`,
        e
      ));
    }

    pluginFunctions = pluginFunctions.filter((pluginFunction) => {
      if (pluginFunction instanceof AntFunction) {
        return true;
      } else {
        this._loadingErrors.push(new AntError(
          `Could not load one of "${this.getPluginName(plugin)}" plugin \
function: it is not a Function`
        ));
        return false;
      }
    });

    return pluginFunctions;
  }

  /**
   * Loads a specific plugin's Yargs settings in a safe way.
   * @param {!Plugin} plugin The plugin whose Yargs settings will be loaded.
   * @param {Object} yargs The
   * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} object
   * to which the settings will be loaded.
   * @throws {AssertionError} If the passed "plugin" param is not an instance of
   * the {@link Plugin} class.
   */
  loadPluginYargsSettings(plugin, yargs) {
    assert(
      plugin instanceof Plugin,
      'Could not load plugin\'s Yargs settings: param "plugin" should be Plugin'
    );

    try {
      plugin.loadYargsSettings(yargs);
    } catch (e) {
      this._loadingErrors.push(new AntError(
        `Could not load "${this.getPluginName(plugin)}" plugin's Yargs \
settings`,
        e
      ));
    }
  }
}

module.exports = PluginController;
