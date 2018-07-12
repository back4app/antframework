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
      'create <service> [--template <name>]',
      'Create a new service',
      {
        template: {
          alias: 't',
          describe: 'Specify the template to be used for the new service',
          type: 'string',
          requiresArg: true
        }
      },
      () => {
        process.exit(0);
      }
    );
  }
}

module.exports = Core;
