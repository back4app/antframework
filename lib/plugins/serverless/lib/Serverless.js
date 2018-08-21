/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Serverless} plugin class.
 */

const Plugin = require('../../Plugin');
const Provider = require('../../../hosts/providers/Provider');

/**
 * Represents a plugin containing functionalities to deploy Ant Framework's
 * functions using the Serverless framework.
 * @extends Plugin
 */
class Serverless extends Plugin {
  /**
   * @param {!Ant} ant The {@link Ant} framework instance that is loading the
   * plugin.
   * @param {Object} config The plugin config settings.
   * @param {String} config.basePath The base path to be used by the plugin.
   * @throws {AssertionError} If the "ant" param is not passed.
   */
  constructor(ant, config) {
    super(ant, config);

    /**
     * Contains the Serverless plugin providers
     * @type {Array<Provider>}
     * @private
     */
    this._providers = [
      new Provider(
        'Serverless',
        (config, functions) => this._deploy(config, functions)
      )
    ];
  }

  get providers() {
    return this._providers;
  }

  /**
   * Deploys the passed to a host using the Serverless framework.
   * @param {Object} config The deployment config settings.
   * @param {!Array<AntFunction>} functions The functions to be deployed.
   * @async
   * @private
   */
  async _deploy() {}
}

module.exports = Serverless;
