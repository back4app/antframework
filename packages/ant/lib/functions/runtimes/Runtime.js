/**
 * @fileoverview Defines and exports the {@link Runtime} class.
 */

const assert = require('assert');
const BinFunction = require('../BinFunction');
const semver = require('semver');

/**
 * @class ant/Runtime
 * Represents a function that contains a binary file that will be used to
 * execute a lib function.
 * @extends BinFunction
 */
class Runtime extends BinFunction {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is initializing
   * the function.
   * @param {!String} name The function name.
   * @param {!String} bin The path to the bin file.
   * @param {Array<String>} extensions An array of the extensions that this
   * runtime supports to execute.
   * @param {String} template The path to the file to be used as template
   * when creating new functions with this runtime
   * @param {!String} version The runtime version supported
   * @param {Boolean} isDefault Flag indicating it should be set as default
   * @throws {AssertionError} If "ant", "name", "bin" or "extensions" params are
   * not valid.
   */
  constructor(ant, name, bin, extensions, template, version, isDefault) {
    super(ant, name, bin);

    assert(
      !extensions || extensions instanceof Array,
      'Could not initialize Runtime: param "extensions" should be Array'
    );
    assert(
      typeof version === 'string' && version.trim() !== '',
      'Could not initialize Runtime: param "version" should be non empty String'
    );

    /**
     * Contains the extensions that this runtime supports to execute.
     * @type {Array<String>}
     * @private
     */
    this._extensions = extensions;

    /**
     * The path to the file to be used as template when creating new
     * functions with this runtime.
     * @type {String}
     * @private
     */
    this._template = template;

    /**
     * The runtime version supported.
     * @type {String}
     * @private
     */
    this._version = semver.major(semver.coerce(version)).toString();

    /**
     * Flag indicating it should be set as default
     * @type {Boolean}
     * @private
     */
    this._isDefault = isDefault;
  }

  /**
   * Contains the extensions that this runtime supports to execute.
   * @type {Array<String>}
   * @readonly
   */
  get extensions() {
    return this._extensions;
  }

  /**
   * Returns the path to the file to be used as template when creating
   * new functions with this runtime.
   * @type {String}
   */
  get template() {
    return this._template;
  }

  /**
   * Returns the runtime version supported.
   * @type {String}
   */
  get version() {
    return this._version;
  }

  /**
   * Returns the flag indicating it should be set as default.
   * @type {Boolean}
   */
  get isDefault() {
    return this._isDefault;
  }
}

module.exports = Runtime;
