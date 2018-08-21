/**
 * @fileoverview Defines and exports the {@link Host} class.
 */

const assert = require('assert');
const Provider = require('./providers/Provider');

/**
 * Represents a host that can be used to deploy the Ant Framework's functions.
 */
class Host {
  /**
   * @param {!String} name The host name.
   * @param {!Provider} provider The host provider.
   * @param {Object} config The host deployment config settings.
   * @throws {AssertionError} If "name" param is not valid.
   */
  constructor(name, provider, config) {
    assert(
      typeof name === 'string',
      'Could not initialize Host: param "name" should be String'
    );
    assert(
      provider instanceof Provider,
      'Could not initialize Host: param "provider" should be Provider'
    );
    assert(
      !config || typeof config === 'object',
      'Could not initialize Host: param "config" should be Object'
    );

    /**
     * Contains the host name.
     * @type {String}
     * @private
     */
    this._name = name;

    /**
     * Contains the host provider.
     * @type {Provider}
     * @private
     */
    this._provider = provider;

    /**
     * Contains the host deployment config settings.
     * @type {Object}
     * @private
     */
    this._config = config;
  }

  /**
   * Contains the host name.
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * Contains the host provider.
   * @type {Provider}
   * @readonly
   */
  get provider() {
    return this._provider;
  }

  /**
   * Contains the host deployment config settings.
   * @type {Object}
   * @readonly
   */
  get config() {
    return this._config;
  }

  /**
   * Deploys the passed functions to the host.
   * @param {!Array<AntFunction>} functions The functions to be deployed.
   * @async
   */
  async deploy(functions) {
    await this.provider.deploy(this.config, functions);
  }
}

module.exports = Host;
