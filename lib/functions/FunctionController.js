/**
 * @fileoverview Defines and exports the {@link FunctionController} class.
 */

const assert = require('assert');
const AntFunction = require('./AntFunction');

/**
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
   * @throws {AssertionError} If the functions is not a valid Array of
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
be an instance of Function`
      );
      this._functions.set(
        antFunction.name,
        antFunction
      );
    }
  }

  /**
  * Gets a specific function by its name.
  * @param {String} name The name of the function to be gotten.
  * @return {AntFunction} The function object.
  */
  getFunction(name) {
    return this._functions.get(name) || null;
  }
}

module.exports = FunctionController;
