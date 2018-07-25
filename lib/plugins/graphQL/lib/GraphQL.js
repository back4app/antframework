/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link GraphQL} plugin class.
 */

const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');

/**
 * Represents a plugin containing functionalities to build and run GraphQL APIs
 * with Ant Framework.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
 */
class GraphQL extends Plugin {
  constructor(ant) {
    super(ant);

    /**
     * This method is introduced to the {@link Ant} instance by the
     * {@link GraphQL} plugin and can be used to run a GraphQL service. It will
     * only be available if the {@link GraphQL} plugin is installed and loaded
     * in the {@link Ant} instance.
     * @alias runService
     * @memberof Ant#
     * @requires module:antframework/lib/plugins/graphQL
     */
    this._ant.runService = () => this.runService();
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'run [--config <path>]',
      'Run a service in localhost',
      {},
      () => {
        try {
          this.runService();
          console.log('Service running...');
          process.exit(0);
        } catch (e) {
          yargsHelper.handleErrorMessage(e.message, e, 'run');
        }
      }
    ).fail(msg => this._yargsFailed(msg));
  }

  /**
   * Runs when the yargs fails to parse the argv and it is used to define custom
   * error messages.
   * @param {String} msg The original Yargs message.
   * @private
   */
  _yargsFailed(msg) {
    if (
      process.argv.includes('run') &&
      msg &&
      msg.includes('Unknown argument: configpath')
    ) {
      msg = 'Run command accepts no arguments';
      yargsHelper.handleErrorMessage(
        'Run command accepts no arguments',
        null,
        'run'
      );
    }
  }

  /**
   * Run a GraphQL service.
   */
  runService() {}
}

module.exports = GraphQL;
