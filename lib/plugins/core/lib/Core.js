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
      async (argv) => {
        await this.createService(argv.service, argv.template);
        process.exit(0);
      }
    );
  }

  /**
   * Creates a new service
   * @param {!String} name The new service name
   * @param {String} template The name of the template to be used during the new
   * service creation.
   * @async
   */
  async createService() {}
}

module.exports = Core;
