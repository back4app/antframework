/**
 * @fileoverview Defines and exports the {@link RuntimeController} class.
 */

const assert = require('assert');
const Runtime = require('./Runtime');
const semver = require('semver');

/**
 * @class ant/RuntimeController
 * Represents a controller for the Ant Framework's runtimes.
 */
class RuntimeController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<Runtime>} runtimes An array of runtimes to be loaded.
  * @throws {AssertionError} If "ant" or "runtimes" params are not valid.
  */
  constructor(ant, runtimes) {
    assert(
      ant,
      'Could not initialize the runtime controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../../Ant'),
      'Could not initialize the runtime controller: param "ant" should be Ant'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * runtime controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded runtimes.
    * @type {Map}
    * @private
    */
    this._runtimes = new Map();

    this._loadPluginsRuntimes();

    // Notice that functions from plugins can be overridden here
    // if name matches.
    if (runtimes) {
      this.loadRuntimes(runtimes);
    }

    this._defaultRuntime;
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * runtime controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
  * Loads the framework runtimes from each of the loaded plugins.
  * @private
  */
  _loadPluginsRuntimes() {
    this.ant.pluginController.pluginsObservable.subscribe(plugin => {
      const pluginRuntimes = this._ant.pluginController.getPluginRuntimes(
        plugin
      );
      this.loadRuntimes(pluginRuntimes);
    });
  }

  /**
   * Loads the runtimes from the provided array.
   * @param {!Array<Runtime>} runtimes The array of {@link Runtime} to
   * be loaded
   * @throws {AssertionError} If the "runtimes" param is not a valid Array of
   * {@link Runtime}.
   */
  loadRuntimes(runtimes) {
    assert(
      runtimes instanceof Array,
      'Could not load runtimes: param "runtimes" should be Array'
    );
    for (const runtime of runtimes) {
      assert(
        runtime instanceof Runtime,
        `Runtime "${runtime.name || runtime.constructor.name}" should \
be an instance of Runtime`
      );
      assert.equal(
        runtime.ant,
        this.ant,
        `Could not load runtime ${runtime.name}: the framework used to \
initialize the runtime is different to this controller's`
      );
      let runtimeByVersion = this._runtimes.get(runtime.name);
      if (!runtimeByVersion) {
        runtimeByVersion = new Map();
        // If this is the first runtime by its name,
        // set it as the default
        runtimeByVersion.set('default', runtime);
        this._runtimes.set(runtime.name, runtimeByVersion);
      } else if (runtime.isDefault){
        // If isDefault is true, overrides the actual default runtime
        runtimeByVersion.set('default', runtime);
      }
      runtimeByVersion.set(runtime.version, runtime);
    }
  }

  /**
   * Contains the loaded runtimes.
   * @type {Map<String, Map<String, Runtime>>}
   * @readonly
   */
  get runtimes() {
    return this._runtimes;
  }

  /**
  * Gets a specific runtime by its name.
  * @param {String} name The name of the runtime to be gotten.
  * @param {String} version The target runtime version.
  * @return {Runtime} The runtime object.
  */
  getRuntime(name, version) {
    assert(typeof name === 'string', 'Could not get runtime. "name" should be String');
    const runtimeByVersion = this._runtimes.get(name);
    if (!runtimeByVersion || runtimeByVersion.length === 0) {
      return null;
    }
    // If version was not provided, returns the default
    // runtime by its name
    if (!version) {
      return runtimeByVersion.get('default');
    }
    assert(typeof version === 'string' && version.length, 'Could not get runtime. "version" \
should be non-empty String');
    return runtimeByVersion.get(semver.major(semver.coerce(version)).toString()) || null;
  }

  /**
   * Contains the default runtime defined in this controller.
   * @type {Runtime}
   */
  get defaultRuntime() {
    return this._defaultRuntime;
  }

  /**
   * Sets the controller's default {@link Runtime}.
   *
   * @param {Runtime} defaultRuntime The {@link Runtime} to be set
   * as the controller's default
   */
  set defaultRuntime(defaultRuntime) {
    if (defaultRuntime) {
      assert(
        defaultRuntime instanceof Runtime,
        'Could not set controller\' default runtime: param \
  "defaultRuntime" should be Runtime'
      );
      this._defaultRuntime = defaultRuntime;
    }
  }
}

module.exports = RuntimeController;
