const Plugin = require('./Plugin');

class PluginController {
  constructor(plugins) {
    this._plugins = new Map();
    this._loadingErrors = [];

    if (plugins) {
      this._loadPlugins(plugins);
    }
  }

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

  _loadPlugin(plugin, args) {
    if (typeof plugin === 'string') {
      try {
        plugin = new (require(plugin))(args);
      } catch (e) {
        throw new Error(`Could not load plugin module "${plugin}": ${e}`);
      }

      if (!(plugin instanceof Plugin)) {
        throw new Error(
          `Could not load plugin module "${plugin}": it should export a Plugin`
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

  get plugins() {
    return Array.from(this._plugins.values());
  }

  get loadingErrors() {
    return this._loadingErrors;
  }

  getPluginName(plugin) {
    try {
      return plugin.name;
    } catch (e) {
      this._loadingErrors.push(e);
      return Plugin.getPluginName(plugin);
    }
  }
}

module.exports = PluginController;
