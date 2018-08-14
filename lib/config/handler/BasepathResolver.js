const assert = require('assert');
const ConfigJSONHandler = require('./ConfigJSONHandler');
const path = require('path');

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
   * @param {String} configFilePath The configuration file path.
   * @returns {String} The absolute base path, considering the current
   * working directory, the configuration file path and the configuration base path
   */
  handle(json, { filePath }) {
    const { basePath } = json;
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
  }
}

module.exports = BasepathResolver;
