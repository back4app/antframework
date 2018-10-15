/**
 * @fileoverview Defines and exports the {@link DirectiveController} class.
 */

const assert = require('assert');
const { AntError } = require('@back4app/ant-util');
const { LibFunction, Ant } = require('@back4app/ant');
const Directive = require('./Directive');
const path = require('path');

/**
 * @class ant-graphql/DirectiveController
 * Represents a controller for the Ant Framework GraphQL plugin's directives.
 */
class DirectiveController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Object} directives The "directives" object from the configuration file
  * @param {String} basePath The base path considered when resolving directive
  * resolvers path
  * @throws {AssertionError} If "ant" or "directives" params are not valid.
  */
  constructor(ant, directives, basePath) {
    assert(
      ant instanceof Ant,
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
     * Contains the controller's base path.
     * Required in order to resolve the directive resolvers path.
     * @type {String}
     * @private
     */
    this._basePath = basePath;

    /**
    * Contains the erros generated during directives loading.
    * @type {Error[]}
    * @private
    */
    this._loadingErrors = [];

    this._loadPluginsDirectives();

    /**
     * Contains the directives configuration object from the
     * GraphQL configuration file
     * @type {Object}
     * @private
     */
    this._configDirectives = directives;
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
    if (this._configDirectives) {
      this._loadLazyDirectives();
    }
    return Array.from(this._directives.values());
  }

  /**
  * Gets a specific directive by its name.
  * @param {String} name The name of the directive to be gotten.
  * @return {Directive} The directive object.
  */
  getDirective(name) {
    if (this._configDirectives) {
      this._loadLazyDirectives();
    }
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

  /**
   * Parses the {@link Directive} from this._configDirectives
   * and the loading to the {@link DirectiveController#loadDirectives} method.
   * The {@link Directive} from the configuration file should
   * respect the following format, under the "directives" key:
   * ```
   * {
   *   <name>: {
   *     resolver: {
   *       handler: <handler>,
   *       runtime: <runtime>
   *     },
   *     definition: <definition>
   *   }
   * }
   * ```
   *
   * Where:
   * * `<name>` is the {@link Directive} name;
   * * `<handler>` is the path to the function to resolve the {@link Directive};
   * * `<runtime>` the runtime name to execute the handler;
   * * `<definition>` the GraphQL definition of the directive, to be
   * injected into the GraphQL schema.
   *
   * It is needed to do a lazy loading in order to resolve Directives
   * dependencies such as other {@link AntFunction} and {@link Runtime} from other
   * plugins not yet loaded.
   * Lazy loading does not have an impact on the behavior of the
   * framework, since they are only needed when the GraphQL server
   * is being initialized.
   *
   * @private
   */
  _loadLazyDirectives() {
    const directives = [];
    for (const [name, { resolver: resolverConfig, definition }]
      of Object.entries(this._configDirectives)) {
      assert(resolverConfig instanceof Object, `Could not load \
directive "${name}". "resolver" should be an object`);
      const { handler, runtime } = resolverConfig;
      const resolver = new LibFunction(this.ant, name,
        path.resolve(this._basePath, handler),
        this.ant.runtimeController.getRuntime(runtime)
      );
      directives.push(
        new Directive(this.ant, name, definition, resolver)
      );
    }
    this._configDirectives = null;
    this.loadDirectives(directives);
  }
}

module.exports = DirectiveController;
