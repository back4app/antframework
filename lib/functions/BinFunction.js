/**
 * @fileoverview Defines and exports the {@link BinFunction} class.
 */

const assert = require('assert');
const childProcess = require('child_process');
const AntError = require('../util/AntError');
const logger = require('../util/logger');
const rxjsHelper = require('../util/rxjsHelper');
const AntFunction = require('./AntFunction');

/**
 * Represents a function that contains a binary file that will be executed by
 * the Ant Framework during the running process.
 * @extends AntFunction
 */
class BinFunction extends AntFunction {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is initializing
   * the function.
   * @param {!String} name The function name.
   * @param {!String} bin The path to the bin file.
   * @throws {AssertionError} If "ant", "name" or "bin" params are not valid.
   */
  constructor(ant, name, bin) {
    super(ant, name);

    assert(
      typeof bin === 'string',
      'Could not initialize BinFunction: param "bin" should be String'
    );

    /**
     * Contains the path to the bin file.
     * @type {String}
     * @private
     */
    this._bin = bin;

    /**
     * Contains the [ChildProcess]{@link https://nodejs.org/api/child_process.html#child_process_class_childprocess}
     * created when spawning the bin execution process.
     * @type {ChildProcess}
     * @private
     */
    this._binProcess = null;
  }

  /**
   * Runs the function. It can receive different arguments depending on the
   * function instance.
   * @param {Array<String>} args The function arguments. They will be sent
   during the bin file execution in the argv.
   * @param {Object} options The options to be used when spawning the process
   * according to {@link https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options}.
   * @return {Observable} An [Observable]{@link https://rxjs-dev.firebaseapp.com/api/index/class/Observable}
   * to observe the execution events.
   * @throws {AssertionError} If "args" param is not Array of String.
   * @throws {AntError} If the bin execution fails.
   * @example
   * binFunction.run().subscribe(
   *   (data) => { console.log(data); },
   *   (err) => { console.error(err); },
   *   () => { console.log('completed'); }
   * )
   */
  run(args, options) {
    if (args) {
      assert(
        args instanceof Array,
        'Could not run bin function: param "args" should be Array of String'
      );
      for (const arg of args) {
        assert(
          typeof arg === 'string',
          'Could not run bin function: param "args" should be Array of String'
        );
      }
    }

    return rxjsHelper.createObservable(
      (next, error, complete) => {
        logger.log(`Running bin function ${this.name}...`);

        try {
          this._binProcess = childProcess.spawn(this._bin, args, options);
        } catch (e) {
          error(new AntError(
            `Could not spawn "${this.name}" bin function process`,
            e
          ));
          return;
        }

        logger.log('Bin function process successfully spawned');
        logger.log('Waiting for bin function process events');

        this._binProcess.stdout.on('data', (data) => {
          data = data.toString();
          next(data);
          logger.log(`Bin function ${this.name} => ${data}`);
        });

        this._binProcess.stderr.on('data', (data) => {
          data = data.toString();
          logger.error(`Bin function ${this.name} => ${data}`);
        });

        this._binProcess.on('error', (err) => {
          const message = `${this.name} bin function process crashed`;
          logger.error(message);
          error(new AntError(message, err));
        });

        this._binProcess.on('close', (code) => {
          const message = `${this.name} bin function process closed with code \
"${code}"`;
          if (code === 0) {
            logger.log(message);
            complete();
          } else {
            logger.error(message);
            error(new AntError(message));
          }
        });
      }
    );
  }
}

module.exports = BinFunction;
