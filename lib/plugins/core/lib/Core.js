/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Core} plugin class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs-extra');
const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const yargsHelper = require('../../../util/yargsHelper');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');
const BinFunction = require('../../../functions/BinFunction');
const LibFunction = require('../../../functions/LibFunction');
const Runtime = require('../../../functions/runtimes/Runtime');
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
     * Contains the Core plugin runtimes.
     * @type {Array<Runtime>}
     * @private
     */
    this._runtimes = [
      new Runtime(
        this._ant,
        'Node',
        path.resolve(__dirname, '../functions/nodeRuntime.js'),
        ['js'],
        path.resolve(__dirname, '../templates/function/node.js.mustache')
      )
    ];
  }

  get templates() {
    return templates;
  }

  get runtimes() {
    return this._runtimes;
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'create <service> [--template <template>]',
      'Create a new service',
      {
        template: {
          alias: 't',
          describe: 'Specify the template name or template files path for the new service',
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
      'deploy [--config <path>]',
      'Deploy a service in remote hosts',
      {},
      async () => {
        try {
          await this.deployService();
          console.log('Service successfully deployed');
          process.exit(0);
        } catch (e) {
          yargsHelper.handleErrorMessage(e.message, e, 'deploy');
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
    ).command(
      'function <command>',
      'Manage functions of Ant framework', yargs => {
        yargs.command(
          'add <name> [function] [runtime]',
          'Adds/overrides a function', yargs => {
            yargs.positional('name', {
              describe: 'The name of the function',
              string: true
            }).positional('function', {
              describe: 'The path to the function',
              string: true
            }).positional('runtime', {
              describe: 'The runtime to run the function',
              string: true,
            }).option('global', {
              alias: 'g',
              describe: 'Adds the function into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            }).option('type', {
              alias: 'f',
              describe: 'Specifies which type of function will be added',
              choices: ['lib', 'bin'],
              default: 'lib'
            }).option('template', {
              alias: 't',
              describe: 'The template to render the function in case no source \
file is found at the given path'
            });
          },
          async argv => {
            try {
              const { name, function: func, runtime, type, global, template } = argv;
              await this.addFunction(name, func, runtime, type, global, template);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'function add');
            }
          }
        ).command(
          'remove <name> [--global]',
          'Removes a function', yargs => {
            yargs.positional('name', {
              describe: 'The function name',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Removes function from global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async argv => {
            try {
              const { name, global } = argv;
              await this.removeFunction(name, global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'function remove');
            }
          }
        ).command(
          'ls',
          'Lists all functions available',
          () => {},
          async () => {
            try {
              await this.listFunctions();
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'function ls');
            }
          }
        ).command(
          'exec <function> [args..]',
          'Executes a function', yargs => {
            yargs.positional('function', {
              describe: 'The function name',
              string: true
            }).positional('args', {
              describe: 'One or more execution arguments',
              type: 'string'
            });
          },
          async argv => {
            try {
              const observable = await this.execFunction(argv.function, argv.args);
              const onNext = data => {
                console.log(data);
              };
              const onError = err => {
                console.log(err);
                process.exit(1);
              };
              const onComplete = () => {
                console.log(`Function ${argv.function} executed succesfully`);
                process.exit(0);
              };
              observable.subscribe(
                onNext,
                onError,
                onComplete
              );
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'function exec');
            }
          }
        );
      }
    ).command(
      'runtime <command>',
      'Manage runtimes of Ant framework', yargs => {
        yargs.command(
          'add <name> <bin> [extensions..]',
          'Adds new runtime', yargs => {
            yargs.positional('name', {
              describe: 'The name of the runtime',
              string: true
            }).positional('bin', {
              describe: 'The path to the runtime',
              string: true
            }).positional('extensions', {
              describe: 'The extensions supported by the runtime',
              array: true
            }).option('global', {
              alias: 'g',
              describe: 'Adds runtime into global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              const { name, bin, extensions, global } = argv;
              await this.addRuntime(name, bin, extensions, global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'runtime add');
            }
          }
        ).command(
          'remove <name> [--global]',
          'Removes a runtime', yargs => {
            yargs.positional('name', {
              describe: 'The name of the runtime to be removed',
              string: true
            }).option('global', {
              alias: 'g',
              describe: 'Removes runtime from global configuration file',
              boolean: true,
              nargs: 0,
              default: false
            });
          },
          async (argv) => {
            try {
              const { name, global } = argv;
              await this.removeRuntime(name, global);
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'runtime remove');
            }
          }
        ).command(
          'ls',
          'Lists all runtimes available',
          () => {},
          async () => {
            try {
              await this.listRuntimes();
              process.exit(0);
            } catch (e) {
              yargsHelper.handleErrorMessage(e.message, e, 'runtime ls');
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
        } else if (msg.includes('Unknown argument: templatetemplate')) {
          msg = 'Create command only accepts 1 argument';
          createError = true;
        } else if (msg.includes('Not enough arguments following: template')) {
          msg = 'Template option requires name argument';
          createError = true;
        }
      } else if (
        process.argv.includes('deploy') &&
        msg &&
        msg.includes('Unknown argument: configpath')
      ) {
        yargsHelper.handleErrorMessage(
          'Deploy command accepts no arguments',
          null,
          'deploy'
        );
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
      } else if (argv.includes('function')) {
        const functionCommand = argv[argv.indexOf('function') + 1];
        switch(functionCommand) {
        case 'add':
          command = 'function add';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Function add command requires name and function arguments';
            createError = true;
          }
          break;
        case 'remove':
          command = 'function remove';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Function remove command requires name argument';
            createError = true;
          }
          break;
        case 'exec':
          command = 'function exec';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Function exec command requires name argument';
            createError = true;
          }
          break;
        default:
          command = 'function';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Function requires a command';
            createError = true;
          }
          break;
        }
      } else if (argv.includes('runtime')) {
        const runtimeCommand = argv[argv.indexOf('runtime') + 1];
        switch (runtimeCommand) {
        case 'add':
          command = 'runtime add';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Runtime add command requires name and bin arguments';
            createError = true;
          }
          break;
        case 'remove':
          command = 'runtime remove';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Runtime remove command requires name argument';
            createError = true;
          }
          break;
        default:
          command = 'runtime';
          if (msg.includes('Not enough non-option arguments')) {
            msg = 'Runtime requires a command';
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

    let templateObject = this.ant.templateController.getTemplate(
      'Service',
      template
    );
    if (!templateObject && fs.existsSync(template)) {
      logger.log(`Template ${template} not found under category "Service". \
Considering "${template}" as the template files path.`);
      templateObject = new Template('Service', 'CLI Template', template);
    }
    assert(
      templateObject instanceof Template,
      `Could not create service: template "${template}" was not found`
    );

    await templateObject.render(servicePath, { service: name });

    return servicePath;
  }

  /**
   * Deploys a GraphQL service.
   * @async
   */
  async deployService() {
    if (!this.ant.config) {
      throw new AntError('Could not find service config');
    }
    const hosts = new Map();
    for (const antFunction of this.ant.functionController.functions) {
      const host = antFunction.host;
      if (!host) {
        throw new AntError(
          `There is not a host assigned to the "${antFunction.name}" function`
        );
      } else if (hosts.has(host)) {
        hosts.get(host).push(antFunction);
      } else {
        hosts.set(host, [antFunction]);
      }
    }
    if (!hosts.size) {
      throw new AntError('There are no functions to be deployed.');
    }
    for (const [host, functions] of hosts) {
      logger.log(`Deploying functions to host "${host.name}"`);
      await host.deploy(functions);
    }
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
   * Adds a function into the configuration file and saves it.
   * If runtime is provided, an instance of {@link LibFunction} will
   * be created. If not, an instance of {@link BinFunction} will be created
   * instead.
   *
   * @param {!String} name The name of the function to be added
   * @param {String} func The path of the function
   * @param {Runtime} runtime The runtime to run the function
   * @param {String} type The type of the AntFunction that will be added
   * @param {Boolean} isGlobal True if should be added into global configuration,
   * false if it should be added into local configuration
   * @param {String} template The path to the template to render the function
   * source file when it does not exists
   */
  async addFunction(name, func, runtime, type = 'lib', isGlobal, template) {
    const config = Core._getConfig(isGlobal);
    switch(type) {
    case 'lib':
      /* eslint-disable no-case-declarations */
      const runtimeInstance = runtime
        ? this.ant.runtimeController.getRuntime(runtime)
        : this.ant.runtimeController.defaultRuntime;

      // If function path is not defined, sets it to the current working
      // directory, where the file name is the function name, and the
      // extension is the first defined extension in the runtime
      if (!func && runtimeInstance.extensions.length) {
        const extension = runtimeInstance.extensions[0];
        func = path.resolve(
          process.cwd(),
          `${name}.${extension}`
        );
      }
      // If template is not defined and the runtime has a
      // template for new functions, we should use it to render
      // the function source file
      if (!template && runtimeInstance.template) {
        template = runtimeInstance.template;
      }
      config.addFunction(new LibFunction(this.ant, name, func, runtimeInstance));
      break;
    case 'bin':
      config.addFunction(new BinFunction(this.ant, name, func));
      break;
    default:
      throw new AntError(`AntFunction type "${type}" is unknown`);
    }
    // If function source file does not exists and we have a defined
    // template, we should use it to render the function source file
    if (!fs.existsSync(func) && template) {
      await new Template('Function', path.basename(template), template)
        .render(func, { name });
    }
    return config.save();
  }

  /**
   * Removes a function from the configuration file and saves it.
   *
   * @param {!String} name The name of the function to be removed
   * @param {Boolean} isGlobal True if should be removed from global configuration,
   * false if it should be removed from local configuration
   */
  async removeFunction(name, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.removeFunction(name).save();
  }

  /**
   * Lists all functions registered on the {@link functionController} of
   * this {@link Core} instance.
   */
  async listFunctions() {
    const functions = this.ant._functionController.getAllFunctions();
    console.log('Listing all functions available \
(<type> <name>[: (<bin>|<handler> <runtime>)]):');
    functions.forEach(func => {
      const additionalInfo = func instanceof BinFunction
        ? `: ${func.bin}`
        : func instanceof LibFunction
          ? `: ${func.handler} ${func.runtime.name}`
          : '';
      console.log(`${func.constructor.name} ${func.name}${additionalInfo}`);
    });
  }

  /**
   * Executes a function, providing a list of arguments.
   *
   * @param {!String} name The name of the function to be executed
   * @param {Array} args The array of arguments to be provided to
   * the function
   */
  async execFunction(name, args) {
    const func = this.ant.functionController.getFunction(name);
    if (!func) {
      logger.error(`Function ${name} not found to be executed.`);
      return;
    }
    console.log(`Running function ${name}...`);
    return await func.run(...args);
  }

  /**
   * Adds a runtime into the configuration file and saves it.
   *
   * @param {!String} name The name of the runtime to be added
   * @param {!String} bin The path to the runtime
   * @param {Array} extensions The extensions supported by the runtime
   * @param {Boolean} isGlobal True if should be added into global configuration,
   * false if it should be added into local configuration
   */
  async addRuntime(name, bin, extensions, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.addRuntime(new Runtime(
      this.ant, name, bin, extensions
    )).save();
  }

  /**
   * Removes a runtime from the configuration file and saves it.
   *
   * @param {!String} name The name of the runtime to be removed
   * @param {Boolean} isGlobal True if should be removed from global configuration,
   * false if it should be removed from local configuration
   */
  async removeRuntime(name, isGlobal) {
    const config = Core._getConfig(isGlobal);
    return config.removeRuntime(name).save();
  }

  /**
   * Lists all {@link Runtime} registered on the {@link RuntimeController} of
   * this {@link Core} instance.
   */
  async listRuntimes() {
    const runtimes = this.ant.runtimeController.runtimes;
    console.log('Listing all runtimes available \
(<name> <bin> [extensions]):');
    runtimes.forEach(({ name, bin, extensions }) => {
      console.log(`${name} ${bin}${extensions ? ` ${extensions.join(' ')}` : ''}`);
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
