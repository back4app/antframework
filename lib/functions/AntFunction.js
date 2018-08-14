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
   * @param {Function} runFunction The function to be used as the run method.
   * @throws {AssertionError} If "name" or "runFunction" params are not valid.
   */
  constructor(name, runFunction) {
    assert(
      typeof name === 'string',
      'Could not initialize AntFunction: param "name" should be String'
    );
    assert(
      !runFunction || typeof runFunction === 'function',
      'Could not initialize AntFunction: param "runFunction" should be function'
    );

    /**
     * Contains the function name.
     * @type {String}
     * @private
     */
    this._name = name;

    if (runFunction) {
      this.run = runFunction;
    }
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
