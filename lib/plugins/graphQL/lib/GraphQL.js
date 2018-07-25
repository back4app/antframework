/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link GraphQL} plugin class.
 */

const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');

/**
 * Represents a plugin containing functionalities to build and start GraphQL API
 * services with Ant Framework.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
 */
class GraphQL extends Plugin {
  constructor(ant) {
    super(ant);

    /**
     * This method is introduced to the {@link Ant} instance by the
     * {@link GraphQL} plugin and can be used to start a GraphQL service. It
     * will only be available if the {@link GraphQL} plugin is installed and
     * loaded in the {@link Ant} instance.
     * @alias startService
     * @memberof Ant#
     * @requires module:antframework/lib/plugins/graphQL
     */
    this._ant.startService = () => this.startService();
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'start [--config <path>]',
      'Start a service in localhost',
      {},
      () => {
        try {
          this.startService();
          console.log('Service started...');
          process.exit(0);
        } catch (e) {
          yargsHelper.handleErrorMessage(e.message, e, 'start');
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
      process.argv.includes('start') &&
      msg &&
      msg.includes('Unknown argument: configpath')
    ) {
      msg = 'Start command accepts no arguments';
      yargsHelper.handleErrorMessage(
        'Start command accepts no arguments',
        null,
        'start'
      );
    }
  }

  /**
   * Start a GraphQL service.
   */
  startService() {}
}

module.exports = GraphQL;
