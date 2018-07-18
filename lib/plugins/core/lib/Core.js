/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const path = require('path');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');

/**
 * Represents a plugin containing the Ant Framework's core functionalities.
 * TODO Improve template path?
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} framework instance that is loading the
 * plugin.
 */
class Core extends Plugin {
  get templates() {
    return [
      new Template(
        'Service',
        'Default',
        path.resolve(__dirname, '../templates/service/default')
      )
    ];
  }

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
        try {
          const outPath = await this.createService(argv.service, argv.template);
          console.log(
            `Service "${argv.service}" successfully created in "${outPath}" \
using template "${argv.template}"`
          );
          process.exit(0);
        } catch (e) {
          console.error(`Fatal => ${e}`);
          process.exit(1);
        }
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

    const servicePath = path.resolve(
      process.cwd(),
      name.replace(/[^a-z0-9]/gi, '-')
    );

    if (!template) {
      template = 'Default';
    }
    if (typeof template !== 'string') {
      throw new Error(
        'Could not create service: param "template" should be String'
      );
    }

    const templateObject = this.ant.templateController.getTemplate(
      'Service',
      template
    );
    if (!templateObject) {
      throw new Error(
        `Could not create service: template "${template}" was not found`
      );
    }

    await templateObject.render(servicePath, { service: name });

    return servicePath;
  }
}

module.exports = Core;
