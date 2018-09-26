/**
 * @fileoverview Defines and exports the {@link Provider} class.
 */

const assert = require('assert');

/**
 * Represents a provider that can be used by the hosts in the deployment process
 * of the Ant Framework's functions.
 */
class Provider {
  /**
   * @param {!String} name The provider name.
   * @param {Function} deployFunction The function to be used as the deploy
   * method.
   * @throws {AssertionError} If "name" param is not valid.
   */
  constructor(name, deployFunction) {
    assert(
      typeof name === 'string',
      'Could not initialize Provider: param "name" should be String'
    );
    assert(
      !deployFunction || typeof deployFunction === 'function',
      'Could not initialize Provider: param "deployFunction" should be Function'
    );

    /**
     * Contains the provider name.
     * @type {String}
     * @private
     */
    this._name = name;

    if (deployFunction) {
      this.deploy = deployFunction;
    }
  }

  /**
   * Contains the provider name.
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * Deploys the passed functions.
   * @param {Object} config The deployment config settings.
   * @param {!Array<AntFunction>} functions The functions to be deployed.
   * @async
   */
  async deploy() {}
}

module.exports = Provider;
