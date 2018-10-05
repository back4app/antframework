/**
 * @fileoverview Defines and exports the {@link FunctionsResolver} class.
 */

const path = require('path');
const ConfigJSONHandler = require('./ConfigJSONHandler');

/**
 * @class ant/FunctionsResolver
 * Represents a resolver to lead with the functions configuration.
 * @extends ConfigJSONHandler
 */
class FunctionsResolver extends ConfigJSONHandler {
  /**
   * Resolves the functions paths if they are not absolute.
   *
   * @param {Array} functions The functions map from the configuration JSON
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   */
  _resolveFunctionsPaths({ functions, basePath }) {
    if (functions) {
      Object.keys(functions).forEach(name => {
        const func = functions[name];
        const { bin, handler } = func;
        if (bin && !bin.startsWith('/')) {
          func.bin = path.resolve(basePath, bin);
        } else if (handler && !handler.startsWith('/')) {
          func.handler = path.resolve(basePath, handler);
        }
      });
    }
  }

  handle(json) {
    this._resolveFunctionsPaths(json);
  }
}

module.exports = FunctionsResolver;
