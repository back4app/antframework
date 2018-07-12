/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const Plugin = require('../../Plugin');

/**
 * Represents a plugin containing the Ant Framework's core functionalities.
 * @extends Plugin
 */
class Core extends Plugin {
  loadYargsSettings(yargs) {
    yargs.command(
      'create',
      'Create a new service',
      {},
      () => {
        process.exit(0);
      }
    );
  }
}

module.exports = Core;
