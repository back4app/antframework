/**
 * @fileoverview Defines and exports the {@link RuntimesPathResolver} class.
 */

const path = require('path');
const ConfigJSONHandler = require('./ConfigJSONHandler');

/**
 * @class ant/RuntimesPathResolver
 * Represents a resolver to lead with the runtimes configuration.
 * @extends ConfigJSONHandler
 */
class RuntimesPathResolver extends ConfigJSONHandler {
  /**
   * Resolves the runtimes paths if they are not absolute.
   *
   * @param {Object} runtimes The runtimes object from the configuration JSON
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   */
  _resolveFunctionsPaths({ runtimes, basePath }) {
    if (runtimes) {
      Object.keys(runtimes).forEach(name => {
        const runtime = runtimes[name];
        const { bin } = runtime;
        if (bin && !bin.startsWith('/')) {
          runtime.bin = path.resolve(basePath, bin);
        }
      });
    }
  }

  handle(json) {
    this._resolveFunctionsPaths(json);
  }
}

module.exports = RuntimesPathResolver;
