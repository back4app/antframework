/**
 * @fileoverview Defines and exports the {@link BasepathResolver} class.
 */

const assert = require('assert');
const path = require('path');
const ConfigJSONHandler = require('./ConfigJSONHandler');

/**
 * @class ant/BasepathResolver
 * Represents a resolver to lead with the configuration basePath.
 * @extends ConfigJSONHandler
 */
class BasepathResolver extends ConfigJSONHandler {
  /**
   * Resolves the configuration basePath, returning an absolute base path.
   * Takes into consideration the basePath, the configuration file path, and
   * the current working directory.
   *
   * Needed when the basePath found on the configuration file is a relative path,
   * and we need to resolve it before resolving other configurations paths.
   *
   * @param {!String} basePath The configuration basePath whose the absolute
   * base path will be calculated.
   * @param {String} opt.filePath The configuration file path.
   * @returns {String} The absolute base path, considering the current
   * working directory, the configuration file path and the configuration base path
   */
  handle(json, { filePath }) {
    const { basePath, plugins } = json;
    if(basePath) {
      assert(typeof basePath === 'string', 'The configuration basePath must be a String');
      // If basePath is relative, we must resolve it
      if (!basePath.startsWith('/')) {
        // If the configuration file directory is provided, we must use it as our
        // current working directory
        if (filePath) {
          let fileDir = path.parse(filePath).dir;
          if (!fileDir.startsWith('/')) {
            fileDir = path.resolve(process.cwd(), fileDir);
          }
          json.basePath = path.resolve(fileDir, basePath);
        } else {
          json.basePath = path.resolve(process.cwd(), basePath);
        }
      }
    }
    // If basePath is not defined, we must find a way to define it.
    // If provided, we must set the configuration file directory as base path.
    else if (filePath) {
      let configFileDir = path.parse(filePath).dir;
      if (!configFileDir.startsWith('/')) {
        configFileDir = path.resolve(process.cwd(), configFileDir);
      }
      json.basePath = configFileDir;
    }
    // If configuration file directory is not set, set current working
    // directory as base path.
    else {
      json.basePath = process.cwd();
    }

    // For each plugin entry, we should find any "basePath" entry
    // and resolve it as well
    if (plugins) {
      plugins.forEach(pluginEntry => {
        // "plugins" is an array with objects, where the key is the plugin name,
        // and the value is an object which contains its settings
        const [pluginName, plugin] = Object.entries(pluginEntry)[0];
        if (plugin && plugin.basePath && !plugin.basePath.startsWith('/')) {
          pluginEntry[pluginName].basePath = path.resolve(json.basePath, plugin.basePath);
        }
      });
    }
  }
}

module.exports = BasepathResolver;
