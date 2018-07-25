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
    let runError = false;

    if (process.argv.includes('run') && msg) {
      if (msg.includes('Unknown argument: configpath')) {
        msg = 'Run command accepts no arguments';
        runError = true;
      }
    }

    if (runError) {
      yargsHelper.handleErrorMessage(msg, null, 'run');
    }
  }

  /**
   * Run a GraphQL service.
   */
  runService() {}
}

module.exports = GraphQL;
