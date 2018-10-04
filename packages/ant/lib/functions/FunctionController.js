/**
 * @fileoverview Defines and exports the {@link FunctionController} class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { AntError, logger } = require('@back4app/ant-util');
const AntFunction = require('./AntFunction');
const LibFunction = require('./LibFunction');

/**
 * @class ant/FunctionController
 * Represents a controller for the Ant Framework's functions.
 */
class FunctionController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<AntFunction>} functions An array of functions to be loaded.
  * @throws {AssertionError} If "ant" or "functions" params are not valid.
  */
  constructor(ant, functions) {
    assert(
      ant,
      'Could not initialize the function controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize the function controller: param "ant" should be Ant'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * function controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded functions.
    * @type {Map}
    * @private
    */
    this._functions = new Map();

    this._loadPluginsFunctions();

    // Notice that functions from plugins can be overridden here
    // if name matches.
    if (functions) {
      this.loadFunctions(functions);
    }

    this._searchLibFunctions();
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * function controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
  * Loads the framework functions from each of the loaded plugins.
  * @private
  */
  _loadPluginsFunctions() {
    this.ant.pluginController.pluginsObservable.subscribe(plugin => {
      const pluginFunctions = this._ant.pluginController.getPluginFunctions(
        plugin
      );
      this.loadFunctions(pluginFunctions);
    });
  }

  /**
   * Loads the functions from the provided array.
   * @param {!Array<AntFunction>} functions The array of {@link AntFunction} to
   * be loaded
   * @throws {AssertionError} If the "functions" param is not a valid Array of
   * {@link AntFunction}.
   */
  loadFunctions(functions) {
    assert(
      functions instanceof Array,
      'Could not load functions: param "functions" should be Array'
    );

    for (const antFunction of functions) {
      assert(
        antFunction instanceof AntFunction,
        `Function "${antFunction.name || antFunction.constructor.name}" should \
be an instance of AntFunction`
      );
      assert.equal(
        antFunction.ant,
        this.ant,
        `Could not load function ${antFunction.name}: the framework used to \
initialize the function is different to this controller's`
      );
      this._functions.set(
        antFunction.name,
        antFunction
      );
    }
  }

  /**
   * Search for functions in the project path.
   */
  _searchLibFunctions() {
    if (
      this.ant.runtime &&
      this.ant.runtime.extensions &&
      this.ant.config &&
      this.ant.config.basePath
    ) {
      const foundFunctions = [];
      const basePath = this.ant.config.basePath;
      let files = null;
      try {
        files = fs.readdirSync(basePath);
      } catch (e) {
        logger.error(new AntError(
          `Could not read base path "${basePath}"`,
          e
        ));
      }
      if (files) {
        for (const extension of this.ant.runtime.extensions) {
          files.filter(file => file.endsWith(`.${extension}`)).forEach(
            file => foundFunctions.push(new LibFunction(
              this.ant,
              file.split('.')[0],
              path.resolve(basePath, file),
              this.ant.runtime
            ))
          );
        }
      }
      if (foundFunctions.length) {
        this.loadFunctions(foundFunctions);
      }
    }
  }

  /**
   * Contains the loaded functions.
   * @type {AntFunction[]}
   * @readonly
   */
  get functions() {
    return Array.from(this._functions.values());
  }

  /**
  * Gets a specific function by its name.
  * @param {String} name The name of the function to be gotten.
  * @return {AntFunction} The function object.
  */
  getFunction(name) {
    return this._functions.get(name) || null;
  }

  /**
   * Returns all the {@link AntFunction} registered on this
   * instance of {@link FunctionController}.
   *
   * @returns {Array} The array of {@link AntFunction}
   */
  getAllFunctions() {
    const functions = [];
    this._functions.forEach(func => {
      functions.push(func);
    });
    return functions;
  }
}

module.exports = FunctionController;
