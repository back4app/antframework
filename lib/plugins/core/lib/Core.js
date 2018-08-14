/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const assert = require('assert');
const path = require('path');
const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');
const Config = require('../../../config/Config');

const templates = [
  new Template(
    'Service',
    'Default',
    path.resolve(__dirname, '../templates/service/default')
  )
];

/**
 * Represents a plugin containing the Ant Framework's core functionalities.
 * @extends Plugin
 * @param {!Ant} ant The {@link Ant} instance that is loading the plugin.
 * @param {Object} config The config settings for the core plugin.
 * @param {String} config.basePath The base path to be used by the plugin.
 */
class Core extends Plugin {
  get templates() {
    return templates;
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'create <service> [--template <name>]',
      'Create a new service',
      {
        template: {
          alias: 't',
          describe: 'Specify the template for the new service',
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
          yargsHelper.handleErrorMessage(e.message, e, 'create');
        }
      }
    ).command(
      'plugin <command>',
      'Manage plugins of Ant framework', yargs => {
        yargs.command(
          'add <plugin> [--global]',
          'Adds new plugin', yargs => {
            yargs.positional('plugin', {
              describe: 'The plugin to be added',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Adds plugin into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.addPlugin(argv.plugin, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'plugin add');
            }
          }
        ).command(
          'remove <plugin> [--global]',
          'Removes a plugin', yargs => {
            yargs.positional('plugin', {
              describe: 'The plugin to be removed',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Removes plugin from global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.removePlugin(argv.plugin, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'plugin remove');
            }
          }
        );
      }
    ).command(
      'template <command>',
      'Manage templates of Ant framework', yargs => {
        yargs.command(
          'add <category> <template> <path> [--global]',
          'Adds/overrides a template', yargs => {
            yargs.positional('category', {
              describe: 'The template category',
              string: true
            }).positional('template', {
              describe: 'The template to be added/overwritten',
              string: true
            }).positional('path', {
              describe: 'The path to the template files',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Adds template into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.addTemplate(argv.category, argv.template, argv.path, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'template add');
            }
          }
        ).command(
          'remove <category> <template> [--global]',
          'Removes a template', yargs => {
            yargs.positional('category', {
              describe: 'The template category',
              string: true
            }).positional('template', {
              describe: 'The template to be removed',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Removes template from global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              await this.removeTemplate(argv.category, argv.template, argv.global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'template remove');
            }
          }
        ).command(
          'ls',
          'Lists all templates available',
          () => {},
          async () => {
            try {
              await this.listTemplates();
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'template ls');
            }
          }
        );
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
    let createError = false;
    let command = null;
    const { argv } = process;
    if (msg) {
      if (argv.includes('create')) {
        command = 'create';
        if (msg.includes('Not enough non-option arguments')) {
          msg = 'Create command requires service argument';
          createError = true;
        } else if (msg.includes('Unknown argument: templatename')) {
          msg = 'Create command only accepts 1 argument';
          createError = true;
        } else if (msg.includes('Not enough arguments following: template')) {
          msg = 'Template option requires name argument';
          createError = true;
        }
      } else if (argv.includes('plugin')) {
        const pluginCommand = argv[argv.indexOf('plugin') + 1];
        switch(pluginCommand) {
        case 'add':
          command = 'plugin add';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Plugin add command requires plugin argument';
            createError = true;
          }
          break;
        case 'remove':
          command = 'plugin remove';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Plugin remove command requires plugin argument';
            createError = true;
          }
          break;
        default:
          command = 'plugin';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Plugin requires a command';
            createError = true;
          }
          break;
        }
      } else if (argv.includes('template')) {
        const templateCommand = argv[argv.indexOf('template') + 1];
        switch(templateCommand) {
        case 'add':
          command = 'template add';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Template add command requires category, template and path arguments';
            createError = true;
          }
          break;
        case 'remove':
          command = 'template remove';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Template remove command requires category and template arguments';
            createError = true;
          }
          break;
        default:
          command = 'template';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Template requires a command';
            createError = true;
          }
          break;
        }
      }
      if (createError) {
        yargsHelper.handleErrorMessage(msg, null, command);
      }
    }
  }

  /**
   * Creates a new service.
   * @param {!String} name The new service name
   * @param {String} [template=Default] The name of the template to be used during the new
   * service creation.
   * @returns {String} The path to the new service.
   * @throws {AssertionError} If "name" and "template" params are not String.
   * @async
   */
  async createService(name, template) {
    assert(name, 'Could not create service: param "name" is required');
    assert(
      typeof name === 'string',
      'Could not create service: param "name" should be String'
    );

    const servicePath = path.resolve(
      process.cwd(),
      name.replace(/[^a-z0-9]/gi, '-')
    );

    if (!template) {
      template = 'Default';
    }
    assert(
      typeof template === 'string',
      'Could not create service: param "template" should be String'
    );

    const templateObject = this.ant.templateController.getTemplate(
      'Service',
      template
    );
    assert(
      templateObject instanceof Template,
      `Could not create service: template "${template}" was not found`
    );

    await templateObject.render(servicePath, { service: name });

    return servicePath;
  }

  /**
   * Adds a plugin into a configuration file
   *
   * @param {!String} plugin The path to the plugin files
   * @param {Boolean} isGlobal Checked if the plugin should be added on
   * the global configuration file. If not, the plugin will be added on
   * the local configuration file.
   * @returns {String} The path to the configuration file or null if nothing
   * was done.
   */
  async addPlugin(plugin, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.addPlugin(plugin).save();
  }

  /**
   * @param {!String} plugin The path of the plugin to be removed
   * @param {Boolean} isGlobal Checked if the plugin should be removed from
   * the global configuration file. If not, the plugin will be removed from
   * the local configuration file.
   * @returns {String} The path to the configuration file or null if nothing
   * was done.
   */
  async removePlugin(plugin, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.removePlugin(plugin).save();
  }

  /**
   * Adds a template into a configuration file
   *
   * @param {!String} category The category of the template
   * @param {!String} template The name of the template to be added
   * @param {!String} templatePath The path to the template files
   * @param {Boolean} isGlobal True if should be added into global configuration,
   * false if it should be added into local configuration
   * @returns {String} The path of the added template
   */
  async addTemplate(category, template, templatePath, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.addTemplate(category, template, templatePath).save();
  }

  /**
   * Removes a template from a configuration file
   *
   * @param {!String} category The category of the template
   * @param {!String} template The name of the template to be removed
   * @param {Boolean} isGlobal True if should be removed from global configuration,
   * false if it should be removed from local configuration
   * @returns {String} The path of the removed template
   */
  async removeTemplate(category, template, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.removeTemplate(category, template).save();
  }

  /**
   * Lists all {@link Template} loaded by the {@link TemplateController}
   */
  async listTemplates() {
    const templates = this.ant.templateController.getAllTemplates();
    console.log('Listing all templates available (<category>: <name> <path>):');
    templates.forEach(({category, name, path}) => {
      console.log(`${category}: ${name} ${path}`);
    });
  }

  /**
   * Returns an instance of global or local configuration.
   *
   * @param {Boolean} isGlobal flag indicating it should return an instance
   * of global configuration. If false, returns an instance of local configuration.
   * @static
   * @private
   */
  static _getConfig(isGlobal) {
    return isGlobal ? Config.Global : new Config(Config.GetLocalConfigPath());
  }
}

module.exports = Core;
