/**
 * @fileoverview Defines and exports the {@link ProviderController} class.
 */

const assert = require('assert');
const Provider = require('./Provider');

/**
 * @class ant/ProviderController
 * Represents a controller for the Ant Framework's providers.
 */
class ProviderController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<Provider>} providers An array of providers to be loaded.
  * @throws {AssertionError} If "ant" or "providers" params are not valid.
  */
  constructor(ant, providers) {
    assert(
      ant,
      'Could not initialize the provider controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../../Ant'),
      'Could not initialize the provider controller: param "ant" should be Ant'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * provider controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded providers.
    * @type {Map}
    * @private
    */
    this._providers = new Map();

    this._loadPluginsProviders();

    // Notice that providers from plugins can be overridden here
    // if name matches.
    if (providers) {
      this.loadProviders(providers);
    }
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * provider controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
  * Loads the framework providers from each of the loaded plugins.
  * @private
  */
  _loadPluginsProviders() {
    this.ant.pluginController.pluginsObservable.subscribe(plugin => {
      const pluginProviders = this._ant.pluginController.getPluginProviders(
        plugin
      );
      this.loadProviders(pluginProviders);
    });
  }

  /**
   * Loads the providers from the provided array.
   * @param {!Array<Provider>} providers The array of {@link Provider} to
   * be loaded
   * @throws {AssertionError} If the "providers" param is not a valid Array of
   * {@link Provider}.
   */
  loadProviders(providers) {
    assert(
      providers instanceof Array,
      'Could not load providers: param "providers" should be Array'
    );

    for (const provider of providers) {
      assert(
        provider instanceof Provider,
        `Provider "${provider.name || provider.constructor.name}" should \
be an instance of Provider`
      );
      this._providers.set(
        provider.name,
        provider
      );
    }
  }

  /**
   * Contains the loaded providers.
   * @type {Provider[]}
   * @readonly
   */
  get providers() {
    return Array.from(this._providers.values());
  }

  /**
  * Gets a specific providers by its name.
  * @param {String} name The name of the provider to be gotten.
  * @return {Provider} The provider object.
  */
  getProvider(name) {
    return this._providers.get(name) || null;
  }
}

module.exports = ProviderController;
