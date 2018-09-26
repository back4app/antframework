const ConfigJSONHandler = require('./ConfigJSONHandler');

class PluginsPathResolver extends ConfigJSONHandler {
  /**
   * Resolves any relative or node module path for the plugins configuration
   * and updates the "plugins" parameter.
   *
   * DOES NOT updates the plugins configuration parameters, since each plugin
   * would use it in its very own way, we can not assume the paths found are
   * going to follow this pattern.
   *
   * @param {Array} plugins The plugins array from the configuration JSON whose
   * any relative paths shall be resolved.
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   * @private
   * @static
   */
  _resolvePluginsPaths({ plugins, basePath }) {
    if (plugins) {
      plugins.forEach((plugin, index, plugins) => {
        if (typeof plugin === 'string') {
          plugins[index] = this._getPluginResolvedPath(plugin, basePath);
        } else if(typeof plugin === 'object') {
          // Updates the plugin paths
          for (const [pluginPath, pluginConfig] of Object.entries(plugin)) {
            delete plugin[pluginPath];
            plugin[this._getPluginResolvedPath(pluginPath, basePath)] = pluginConfig;
          }
        }
      });
    }
  }

  /**
   * Given a plugin relative path or node module, returns the resolved
   * path of that plugin.
   *
   * @param {!String} plugin The plugin file path or node module name
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   * @returns {String} The resolved path of the plugin
   * @private
   */
  _getPluginResolvedPath(plugin, basePath) {
    // If plugin has an absolute path, does nothing
    if (plugin.startsWith('/')) {
      return plugin;
    }
    try {
      const paths = [basePath].concat(require.main.paths);
      return require.resolve(plugin, { paths });
    } catch (e) {
      // If could not resolve the plugin, does nothing
      return plugin;
    }
  }

  handle(json) {
    this._resolvePluginsPaths(json);
  }
}

module.exports = PluginsPathResolver;
