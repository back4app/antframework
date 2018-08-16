/**
 * @fileoverview Defines and exports the {@link LibFunction} class.
 */

const assert = require('assert');
const { map } = require('rxjs/operators');
const AntError = require('../util/AntError');
const logger = require('../util/logger');
const AntFunction = require('./AntFunction');
const BinFunction = require('./BinFunction');

/**
 * Represents a function containing a handler that will be called using the
 * specified runtime by the Ant Framework during the running process.
 * @extends AntFunction
 */
class LibFunction extends AntFunction {
  /**
   * @param {!String} name The function name.
   * @param {!String} handler The path to the function handler.
   * @param {!BinFunction} runtime The runtime {@link BinFunction} that will be
   * used to call the function.
   * @throws {AssertionError} If "name", "handler" or "runtime" params are not
   * String.
   */
  constructor(name, handler, runtime) {
    super(name);

    assert(
      typeof handler === 'string',
      'Could not initialize LibFunction: param "handler" should be String'
    );

    /**
     * Contains the path to the function handler.
     * @type {String}
     * @private
     */
    this._handler = handler;

    assert(
      runtime instanceof BinFunction,
      'Could not initialize LibFunction: param "runtime" should be String'
    );

    /**
     * Contains the runtime {@link BinFunction} that will be used to call the
     * function.
     * @type {BinFunction}
     * @private
     */
    this._runtime = runtime;
  }

  /**
   * Runs the function. It can receive different arguments depending on the
   * function instance.
   * @return {Observable} An [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
   * to observe the execution events.
   */
  run() {
    logger.log(`Running lib function ${this.name}...`);

    try {
      return this._runtime.run([
        this._handler,
        JSON.stringify(Array.from(arguments))
      ]).pipe(map(data => JSON.parse(data)));
    } catch (e) {
      throw new AntError(`Could not run lib function ${this.name}`, e);
    }
  }
}

module.exports = LibFunction;
