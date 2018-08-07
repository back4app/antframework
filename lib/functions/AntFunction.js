/**
 * @fileoverview Defines and exports the {@link AntFunction} class.
 */

const assert = require('assert');

/**
 * Represents a function that can be executed by the Ant Framework.
 */
class AntFunction {
  /**
   * @param {!String} name The function name.
   * @throws {AssertionError} If "name" param is not String.
   */
  constructor(name) {
    assert(
      typeof name === 'string',
      'Could not initialize AntFunction: param "name" should be String'
    );

    /**
     * Contains the function name.
     * @type {String}
     * @private
     */
    this._name = name;
  }

  /**
   * Contains the function name.
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * Runs the function. It can receive different arguments and return different
   * types depending on the function instance.
   */
  run() {}
}

module.exports = AntFunction;
