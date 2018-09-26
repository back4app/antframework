/**
 * @fileoverview Defines and exports the {@link Directive} class.
 */

const assert = require('assert');
const AntFunction = require('../../../../functions/AntFunction');

/**
 * Represents a GraphQL directive that can use to specify the behavior of a
 * GraphQL API.
 */
class Directive {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is initializing
   * the directive.
   * @param {!String} name The directive name.
   * @param {!String} definition The directive definition to be used in the
   * GraphQL schema.
   * @param {!AntFunction} resolver The {@link AntFunction} that will be
   * responsible to resolve the directive.
   * @throws {AssertionError} If "ant", "name", "definition" or "resolver"
   * params are not valid.
   */
  constructor(ant, name, definition, resolver) {
    assert(
      ant instanceof require('../../../../Ant'),
      'Could not initialize the directive: param "ant" should be Ant'
    );
    assert(
      typeof name === 'string',
      'Could not initialize Directive: param "name" should be String'
    );
    assert(
      typeof definition === 'string',
      'Could not initialize Directive: param "definition" should be String'
    );
    assert(
      resolver instanceof AntFunction,
      'Could not initialize Directive: param "resolver" should be AntFunction'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * directive.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
     * Contains the directive name.
     * @type {String}
     * @private
     */
    this._name = name;

    /**
     * Contains the directive definition.
     * @type {String}
     * @private
     */
    this._definition = definition;

    /**
     * Contains the directive {@link AntFunction} that will be responsible to
     * resolve the directive.
     * @type {AntFunction}
     * @private
     */
    this._resolver = resolver;
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * directive.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
   * Contains the directive name.
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * Contains the directive definition.
   * @type {String}
   * @readonly
   */
  get definition() {
    return this._definition;
  }

  /**
   * Contains the directive {@link AntFunction} that will be responsible to
   * resolve the directive.
   * @type {AntFunction}
   * @readonly
   */
  get resolver() {
    return this._resolver;
  }
}

module.exports = Directive;
