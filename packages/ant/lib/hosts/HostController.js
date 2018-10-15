/**
 * @fileoverview Defines and exports the {@link HostController} class.
 */

const assert = require('assert');
const Host = require('./Host');

/**
 * @class ant/HostController
 * Represents a controller for the Ant Framework's hosts.
 */
class HostController {
  /**
  * @param {!Ant} ant The {@link Ant} framework instance that is initializing
  * the controller.
  * @param {Array<Host>} hosts An array of hosts to be loaded.
  * @throws {AssertionError} If "ant" or "hosts" params are not valid.
  */
  constructor(ant, hosts) {
    assert(
      ant,
      'Could not initialize the host controller: param "ant" is required'
    );
    assert(
      ant instanceof require('../Ant'),
      'Could not initialize the host controller: param "ant" should be Ant'
    );

    /**
    * Contains the {@link Ant} framework instance that initialized the
    * host controller.
    * @type {Ant}
    * @private
    */
    this._ant = ant;

    /**
    * Contains the loaded hosts.
    * @type {Map}
    * @private
    */
    this._hosts = new Map();

    if (hosts) {
      this.loadHosts(hosts);
    }
  }

  /**
  * Contains the {@link Ant} framework instance that initialized the
  * host controller.
  * @type {Ant}
  * @readonly
  */
  get ant() {
    return this._ant;
  }

  /**
   * Loads the hosts from the provided array.
   * @param {!Array<Host>} hosts The array of {@link Host} to
   * be loaded
   * @throws {AssertionError} If the "hosts" paran is not a valid Array of
   * {@link Host}.
   */
  loadHosts(hosts) {
    assert(
      hosts instanceof Array,
      'Could not load hosts: param "hosts" should be Array'
    );

    for (const host of hosts) {
      assert(
        host instanceof Host,
        `Host "${host.name || host.constructor.name}" should be an \
instance of Host`
      );
      this._hosts.set(
        host.name,
        host
      );
    }
  }

  /**
   * Contains the loaded hosts.
   * @type {Host[]}
   * @readonly
   */
  get hosts() {
    return Array.from(this._hosts.values());
  }

  /**
  * Gets a specific host by its name.
  * @param {String} name The name of the host to be gotten.
  * @return {Host} The host object.
  */
  getHost(name) {
    return this._hosts.get(name) || null;
  }
}

module.exports = HostController;
