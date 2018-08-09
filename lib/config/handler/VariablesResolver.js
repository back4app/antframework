const ConfigJSONHandler = require('./ConfigJSONHandler');
const logger = require('../../util/logger');
const path = require('path');

/**
 * Defines the YAML variables that could be used on any YAML document node
 * with a String value.
 * To use a variable, users need to add the prefix '$'.
 *
 * @example <caption>Using the $GLOBAL directory variable</caption>
 * plugins:
 *   - $GLOBAL/plugins/core
 *
 * @property {String} GLOBAL The absolute path to the global directory of
 * the Ant framework
 */
const YAML_VARS = {
  GLOBAL: path.resolve(__dirname, '../../')
};

class VariablesResolver extends ConfigJSONHandler {
  /**
   * Traverses the JSON object given and replaces all variables found.
   *
   * If the current node value is a String, does the replace.
   * If the current node value is an Object, make a recursive call of itself.
   * Otherwise, does nothing.
   *
   * @param json The JSON object to be traversed and whose String values
   * will be replaced with our variables values.
   * @param indentLevel The current indentation level of the JSON tree.
   * Should be incremented every recursive call to adjust the indentation
   * on the logging.
   * @param maxRecursiveCalls The max recursive calls we should do given
   * the json. It is used to control how deep we would like to replace vars
   * on our JSON node tree.
   * @private
   */
  _traverseAndReplaceVars(json, indentLevel = 0, maxRecursiveCalls) {
    const indent = '  '.repeat(indentLevel);
    logger.log('Traversing and replacing variables from configuration JSON:');
    for(const key of Object.keys(json)) {
      const value = json[key];
      if(typeof key === 'string' && key.indexOf('$') > -1) {
        let newKey = key;
        for(const [configVar, varValue] of Object.entries(YAML_VARS)) {
          newKey = newKey.replace(new RegExp(`\\$${configVar}`, 'g'), varValue);
        }
        delete json[key];
        json[newKey] = value;
      }

      if (typeof value === 'object') {
        // If the current value is an object, make a recursive call
        // increasing the height to add some indentation to our log
        logger.log(`${indent}${key}:`);

        if (key === 'plugins') {
          maxRecursiveCalls = 2;
        }
        if (indentLevel < maxRecursiveCalls) {
          this._traverseAndReplaceVars(value, ++indentLevel, maxRecursiveCalls);
        }
      } else {
        if (typeof value === 'string') {
          // If the value is a String, we can replace the current value
          // with our YAML variables and update the JSON
          for(const [configVar, varValue] of Object.entries(YAML_VARS)) {
            json[key] = value.replace(new RegExp(`\\$${configVar}`, 'g'), varValue);
          }
        }
        logger.log(`${indent}${key}: ${json[key]}`);
      }
    }
  }

  handle(json) {
    this._traverseAndReplaceVars(json);
  }
}

module.exports = VariablesResolver;
