/**
 * @fileoverview Defines and exports the {@link DirectiveController} class.
 */

const assert = require('assert');
const AntError = require('../../../../util/AntError');
const Directive = require('./Directive');

/**
 * Represents a controller for the Ant Framework GraphQL plugin's directives.
 */
class DirectiveController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<Directive>} directives An array of directives to be loaded.
  * @throws {AssertionError} If "ant" or "directives" params are not valid.
  */
  constructor(ant, directives) {
    assert(
      ant instanceof require('../../../../Ant'),
      'Could not initialize the directive controller: param "ant" should be Ant'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * directive controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded directives.
    * @type {Map}
    * @private
    */
    this._directives = new Map();

    /**
    * Contains the erros generated during directives loading.
    * @type {Error[]}
    * @private
    */
    this._loadingErrors = [];

    this._loadPluginsDirectives();

    // Notice that directives from plugins can be overridden here.
    if (directives) {
      this.loadDirectives(directives);
    }
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * directive controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
   * Asserts if the passed directive is a valid {@link Directive}.
   * @param {Directive} directive The directive to be asserted.
   * @throws {AssertionError} If it is not a valid {@link Directive}.
   */
  _assertDirective(directive) {
    assert(
      directive instanceof Directive,
      `Directive "${directive.name || directive.constructor.name}" should be \
an instance of Directive`
    );
    assert(
      directive.ant === this.ant,
      `The framework used to initialize the directive \
"${directive.name}" is different of this \
controller's`
    );
  }

  /**
  * Loads the GraphQL directives from each of the loaded plugins.
  * @private
  */
  _loadPluginsDirectives() {
    this.ant.pluginController.pluginsObservable.subscribe(plugin => {
      if ('directives' in plugin) {
        const pluginDirectives = this._ant.pluginController.getFromPlugin(
          plugin,
          'directives',
          directives => {
            assert(
              directives instanceof Array,
              'Directives should be Array'
            );
            directives.forEach(directive => this._assertDirective(directive));
          }
        );
        if (pluginDirectives) {
          this.loadDirectives(pluginDirectives);
        }
      }
    });
  }

  /**
   * Loads the GraphQL directives from the array provided.
   * @param {!Array<Directive>} directives The array of {@link Directive} to be
   * loaded.
   * @throws {AssertionError} If the directives is not a valid Array of
   * {@link Directive}.
   */
  loadDirectives(directives) {
    assert(
      directives instanceof Array,
      'Could not load directives: param "directives" should be Array'
    );

    for (const directive of directives) {
      this._assertDirective(directive);
      this._directives.set(
        this.getDirectiveName(directive),
        directive
      );
    }
  }

  /**
   * Contains the erros generated during directives loading.
   * @type {Error[]}
   * @readonly
   */
  get loadingErrors() {
    return this._loadingErrors;
  }

  /**
   * Contains the laoded directives.
   * @type {Directive[]}
   * @readonly
   */
  get directives() {
    return Array.from(this._directives.values());
  }

  /**
  * Gets a specific directive by its name.
  * @param {String} name The name of the directive to be gotten.
  * @return {Directive} The directive object.
  */
  getDirective(name) {
    return this._directives.get(name) || null;
  }

  /**
   * Gets a specific directive name in a safe way.
   * @param {!Directive} directive The directive whose name will be gotten.
   * @return {String} The directive name.
   * @throws {AssertionError} If the passed "directive" param is not an instance
   * of the {@link Directive} class.
   */
  getDirectiveName(directive) {
    assert(
      directive instanceof Directive,
      'Could not get directive name: param "directive" should be Directive'
    );

    try {
      return directive.name;
    } catch (e) {
      this._loadingErrors.push(new AntError('Could not get directive name', e));
      return directive.constructor.name;
    }
  }

  /**
   * Gets a specific directive definition in a safe way.
   * @param {!Directive} directive The directive whose definition will be
   * gotten.
   * @return {String} The directive definition.
   * @throws {AssertionError} If the passed "directive" param is not an instance
   * of the {@link Directive} class.
   */
  getDirectiveDefinition(directive) {
    assert(
      directive instanceof Directive,
      'Could not get directive definition: param "directive" should be \
Directive'
    );

    try {
      return directive.definition;
    } catch (e) {
      this._loadingErrors.push(new AntError(
        `Could not get "${this.getDirectiveName(directive)}" directive \
definition`,
        e
      ));
      return null;
    }
  }
}

module.exports = DirectiveController;
