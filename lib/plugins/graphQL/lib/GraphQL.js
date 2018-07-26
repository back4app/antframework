/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link GraphQL} plugin class.
 */

const path = require('path');
const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');

const templates = [
  new Template(
    'Server',
    'Default',
    path.resolve(__dirname, '../templates/server/default')
  )
];

/**
 * Represents a plugin containing functionalities to build and start GraphQL API
 * services with Ant Framework.
 * @extends Plugin
 */
class GraphQL extends Plugin {
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

  get templates() {
    return templates;
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
