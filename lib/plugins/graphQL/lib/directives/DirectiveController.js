/**
 * @fileoverview Defines and exports the {@link DirectiveController} class.
 */

const assert = require('assert');
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
    for (const plugin of this.ant.pluginController.plugins) {
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
    }
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
      !directives || directives instanceof Array,
      'Could not load directives: param "directives" should be an array'
    );

    for (const directive of directives) {
      this._assertDirective(directive);
      this._directives.set(
        directive.name,
        directive
      );
    }
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
}

module.exports = DirectiveController;
