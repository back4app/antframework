/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const path = require('path');
const fs = require('fs');
const Plugin = require('../../Plugin');

/**
 * Represents a plugin containing the Ant Framework's core functionalities.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
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
          requiresArg: true,
          default: 'Default'
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
   * @param {String} [template=Default] The name of the template to be used during the new
   * service creation.
   * @throws {Error} If "name" and "template" params are not String.
   * @async
   */
  async createService(name, template) {
    if (!name) {
      throw new Error(
        'Could not create service: param "name" is required'
      );
    }
    if (typeof name !== 'string') {
      throw new Error(
        'Could not create service: param "name" should be String'
      );
    }

    if (!template) {
      template = 'Default';
    }
    if (typeof template !== 'string') {
      throw new Error(
        'Could not create service: param "template" should be String'
      );
    }

    const servicePath = path.resolve(
      process.cwd(),
      name.replace(/[^a-z0-9]/gi, '-')
    );
    if (fs.existsSync(servicePath)) {
      throw new Error(
        `Could not create service: path ${servicePath} already exists`
      );
    }
  }
}

module.exports = Core;
