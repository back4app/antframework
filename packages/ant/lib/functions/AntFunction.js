/**
 * @fileoverview Defines and exports the {@link AntFunction} class.
 */

const assert = require('assert');
const Host = require('../hosts/Host');

/**
 * @class ant/AntFunction
 * Represents a function that can be executed by the Ant Framework.
 */
class AntFunction {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is initializing
   * the function.
   * @param {!String} name The function name.
   * @param {Function} runFunction The function to be used as the run method.
   * @param {Host} host The {@link Host} to which the function will be deployed.
   * @throws {AssertionError} If "ant", "name", "runFunction" or "host" params
   * are not valid.
   */
  constructor(ant, name, runFunction, host) {
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize the AntFunction: param "ant" should be Ant'
    );
    assert(
      typeof name === 'string',
      'Could not initialize AntFunction: param "name" should be String'
    );
    assert(
      !runFunction || typeof runFunction === 'function',
      'Could not initialize AntFunction: param "runFunction" should be Function'
    );
    assert(
      !host || host instanceof Host,
      'Could not initialize AntFunction: param "host" should be Host'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * function.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
     * Contains the function name.
     * @type {String}
     * @private
     */
    this._name = name;

    if (runFunction) {
      this.run = runFunction;
    }

    /**
     * Contains the host to which the function will be deployed.
     * @type {Host}
     * @private
     */
    this._host = host;
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * function.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
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
   * Contains the host to which the function will be deployed. The default value
   * is the same host of the Ant Framework instance that initialized the
   * function.
   * @type {Host}
   * @readonly
   */
  get host() {
    return this._host || this.ant.host || null;
  }

  /**
   * Runs the function. It can receive different arguments and return different
   * types depending on the function instance.
   */
  run() {}
}

module.exports = AntFunction;
