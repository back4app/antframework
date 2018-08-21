const ConfigJSONHandler = require('./ConfigJSONHandler');
const path = require('path');

class FunctionsResolver extends ConfigJSONHandler {
  /**
   * Resolves the functions paths if they are not absolute.
   *
   * @param {Array} functions The functions array from the configuration JSON
   * @param {String} basePath The base path of this configuration that will be
   * used to resolve the relative paths.
   */
  _resolveFunctionsPaths({ functions, basePath }) {
    if (functions) {
      functions.forEach(func => {
        const { bin, handler } = func;
        if (bin) {
          func.bin = path.resolve(basePath, bin);
        } else if (handler) {
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
