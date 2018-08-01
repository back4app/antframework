/**
 * @fileoverview Defines and exports the {@link BinFunction} class.
 */

const assert = require('assert');
const childProcess = require('child_process');
const AntError = require('../util/AntError');
const logger = require('../util/logger');
const AntFunction = require('./AntFunction');

/**
 * Represents a function that contains a binary file that will be executed by
 * the Ant Framework during the running process.
 * @extends AntFunction
 */
class BinFunction extends AntFunction {
  /**
   * @param {!String} name The function name.
   * @param {!String} bin The path to the bin file.
   * @throws {AssertionError} If "name" or "bin" params are not String.
   */
  constructor(name, bin) {
    super(name);

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
   * @return It's specific to each function instance.
   * @throws {AssertionError} If "args" param is not Array of String.
   * @throws {AntError} If the bin execution fails.
   * @async
   */
  async run(args) {
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

    logger.log(`Running bin function ${this.name}...`);

    try {
      this._binProcess = childProcess.spawn(this._bin, args);
    } catch (e) {
      throw new AntError(
        `Could not spawn "${this.name}" bin function process`,
        e
      );
    }

    logger.log('Bin function process successfully spawned');
    logger.log('Waiting for bin function process events');

    let output = [];

    this._binProcess.stdout.on('data', (data) => {
      data = data.toString();
      output.push(data);
      logger.log(`Bin function ${this.name} => ${data}`);
    });

    this._binProcess.stderr.on('data', (data) => {
      data = data.toString();
      logger.error(`Bin function ${this.name} => ${data}`);
    });

    return await (new Promise((resolve, reject) => {
      this._binProcess.on('error', (err) => {
        const message = `${this.name} bin function process crashed`;
        logger.log(message);
        reject(new AntError(message, err));
      });

      this._binProcess.on('close', (code) => {
        const message = `${this.name} bin function process closed with code \
"${code}"`;
        logger.log(message);
        if (code === 0) {
          if (output.length) {
            output = output.join('');
          } else {
            output = undefined;
          }
          resolve(output);
        } else {
          reject(new AntError(message));
        }
      });
    }));
  }
}

module.exports = BinFunction;
