/**
 * @fileoverview Defines and exports the {@link LibFunction} class.
 */

const assert = require('assert');
const { map } = require('rxjs/operators');
const { AntError, logger } = require('@back4app/ant-util');
const AntFunction = require('./AntFunction');
const Runtime = require('./runtimes/Runtime');

/**
 * @class ant/LibFunction
 * Represents a function containing a handler that will be called using the
 * specified runtime by the Ant Framework during the running process.
 * @extends AntFunction
 */
class LibFunction extends AntFunction {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is initializing
   * the function.
   * @param {!String} name The function name.
   * @param {!String} handler The path to the function handler.
   * @param {!Runtime} runtime The {@link Runtime} that will be used to call the
   * function.
   * @throws {AssertionError} If "ant", "name", "handler" or "runtime" params
   * are not valid.
   */
  constructor(ant, name, handler, runtime, args) {
    super(ant, name);

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
      runtime instanceof Runtime,
      'Could not initialize LibFunction: param "runtime" should be Runtime'
    );

    /**
     * Contains the {@link Runtime} that will be used to call the function.
     * @type {Runtime}
     * @private
     */
    this._runtime = runtime;

    /**
     * Contains the fixed arguments that will be used when running the function.
     * @type {Array<String>}
     * @private
     */
    this._args = args || [];
  }

  /**
   * Contains the path to the function handler.
   * @type {String}
   * @readonly
   */
  get handler() {
    return this._handler;
  }

  /**
   * Contains the runtime to run the handler function.
   * @type {Runtime}
   * @readonly
   */
  get runtime() {
    return this._runtime;
  }

  /**
   * Contains the function fixed execution argumnets.
   * @type {Array<String>}
   * @readonly
   */
  get args() {
    return this._args;
  }

  /**
   * Runs the function. It can receive different arguments depending on the
   * function instance.
   * @return {Observable} An [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
   * to observe the execution events.
   */
  run() {
    logger.log(`Running lib function ${this.name}...`);

    const args = JSON.stringify(
      this._args.concat(Array.from(arguments))
    );
    try {
      return this._runtime.run([
        this._handler,
        args
      ]).pipe(map(data => {
        // JSON fails to parse 'undefined', but not '"undefined"'
        try {
          return JSON.parse(data);
        } catch (e) {
          if (typeof data === 'string' && data.trim() === 'undefined') {
            return undefined;
          }
          return data;
        }
      }));
    } catch (e) {
      throw new AntError(`Could not run lib function ${this.name}`, e);
    }
  }
}

module.exports = LibFunction;
