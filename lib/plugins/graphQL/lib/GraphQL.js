/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link GraphQL} plugin class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const yargsHelper = require('../../../util/yargsHelper');
const AntFunction = require('../../../functions/AntFunction');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');
const DirectiveController = require('./directives/DirectiveController');
const Directive = require('./directives/Directive');
const mock = require('../functions/mock');
const resolve = require('../functions/resolve');
const subscribe = require('../functions/subscribe');
const Map = require('yaml/map').default;
const Pair = require('yaml/pair').default;
const Scalar = require('yaml/scalar').default;
const Config = require('../../../config/Config');

const templates = [
  new Template(
    'Server',
    'Default',
    path.resolve(__dirname, '../templates/server/default')
  )
];
const PLUGIN_DEFAULT_LOCATION = '$GLOBAL/plugins/graphQL';
// const variableResolver = new VariablesResolver();

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
     * Contains the GraphQL plugin directives.
     * @type {Array<Directive>}
     * @private
     */
    this._directives = [
      new Directive(
        this._ant,
        'mock',
        'directive @mock(with: String) on FIELD_DEFINITION',
        new AntFunction(
          this._ant,
          'mock',
          mock
        )
      ),
      new Directive(
        this._ant,
        'resolve',
        'directive @resolve(to: String) on FIELD_DEFINITION',
        new AntFunction(
          this._ant,
          'resolve',
          resolve
        )
      ),
      new Directive(
        this._ant,
        'subscribe',
        'directive @subscribe(to: String) on FIELD_DEFINITION',
        new AntFunction(
          this._ant,
          'subscribe',
          subscribe
        )
      )
    ];

    /**
     * This method is introduced to the {@link Ant} instance by the
     * {@link GraphQL} plugin and can be used to start a GraphQL service. It
     * will only be available if the {@link GraphQL} plugin is installed and
     * loaded in the {@link Ant} instance.
     * @async
     * @alias startService
     * @memberof Ant#
     * @requires module:antframework/lib/plugins/graphQL
     */
    this._ant.startService = async () => await this.startService();

    /**
     * Contains the {@link DirectiveController} instance created during the
     * plugin initialization.
     * @type {DirectiveController}
     * @private
     */
    this._directiveController = new DirectiveController(
      this.ant,
      this._config && this._config.directives
    );
  }

  get templates() {
    return templates;
  }

  get directives() {
    return this._directives;
  }

  loadYargsSettings(yargs) {
    yargs.command(
      'start [--config <path>]',
      'Start a service in localhost',
      {},
      async () =>
        yargsHelper.executeCommand(
          'start',
          async () => {
            await this.startService();
          }
        )
    ).command(
      'directive <command>',
      'Manage directives of GraphQL plugin', yargs => {
        yargs.command(
          'add <name> <definition> <handler> [runtime]',
          'Adds a directive into a configuration file',
          yargs => {
            yargs.positional('name', {
              describe: 'The directive name',
              string: true
            }).positional('definition', {
              describe: 'The directive definition',
              string: true
            }).positional('handler', {
              describe: 'The path to the directive resolver',
              string: true,
            }).positional('runtime', {
              describe: 'The name of the resolver runtime',
              string: true
            });
          },
          async ({ name, definition, handler, runtime, config }) =>
            yargsHelper.executeCommand(
              'directive add',
              async () => {
                await this.addDirective(name, definition, handler, runtime, config);
              }
            )
        ).command(
          'remove <name>',
          'Removes a directive from a configuration file',
          yargs => {
            yargs.positional('name', {
              describe: 'The directive name',
              string: true
            });
          },
          async ({ name, config }) =>
            yargsHelper.executeCommand(
              'directive remove',
              async () => {
                await this.removeDirective(name, config);
              }
            )
        ).command(
          'ls',
          'Lists all directives available',
          () => {},
          async () =>
            yargsHelper.executeCommand(
              'directive ls',
              async () => {
                await this.listDirectives();
              }
            )
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
    if (msg) {
      const { argv } = process;
      let command = null;
      let handledErrorMessage = null;
      if (
        argv.includes('start') &&
        msg.includes('Unknown argument: configpath')
      ) {
        command = 'start';
        handledErrorMessage = 'Start command accepts no arguments';
      } else if (argv.includes('directive')) {
        const directiveCommand = argv[argv.indexOf('directive') + 1];
        switch(directiveCommand) {
        case 'add':
          command = 'directive add';
          if (msg.includes('Not enough non-option arguments')) {
            handledErrorMessage = 'Directive add command requires name, definition and handler arguments';
          }
          break;
        case 'remove':
          command = 'directive remove';
          if (msg.includes('Not enough non-option arguments')) {
            handledErrorMessage = 'Directive remove command requires name argument';
          }
          break;
        default:
          command = 'directive';
          if (msg.includes('Not enough non-option arguments')) {
            handledErrorMessage = 'Directive requires a command';
          }
          break;
        }
      }
      if (handledErrorMessage) {
        yargsHelper.handleErrorMessage(
          handledErrorMessage,
          null,
          command
        );
      }
    }
  }

  /**
   * Contains the {@link DirectiveController} instance created during the plugin
   * initialization.
   * @type {DirectiveController}
   * @readonly
   */
  get directiveController() {
    return this._directiveController;
  }

  /**
   * Gets the GraphQL model from config file in base path.
   * @return {String}
   */
  getModel() {
    if (!this._model) {
      let config = this._config;
      if (!config) {
        config = {};
      }

      const cwd = config.basePath || process.cwd();

      const modelPath = path.resolve(
        cwd,
        config.model || './model.graphql'
      );

      try {
        this._model = fs.readFileSync(modelPath, 'utf8');
      } catch (e) {
        throw new AntError(`Could not read model file "${modelPath}"`, e);
      }
    }
    return this._model;
  }

  /**
   * Starts a GraphQL service.
   * @async
   */
  async startService() {
    logger.log('Starting service...');

    let config = this._config;
    if (!config) {
      config = {};
    }

    let server = config.server;
    if (!server) {
      server = {};
    }

    const bin =
      server.bin ||
      path.resolve(__dirname, '../templates/server/default/bin/server.js');

    assert(
      typeof bin === 'string',
      'Could not start service: config setting "server.bin" should be String'
    );

    const port = server.port || 3000;

    assert(
      typeof port === 'number',
      'Could not start service: config setting "server.port" should be Number'
    );

    const cwd = config.basePath || process.cwd();

    const model = this.getModel();

    const args = [JSON.stringify({ antConfig: this.ant.config, model, port })];

    logger.log(
      `Spawning server process with binary "${bin}", args ${args} and working \
directory "${cwd}"`
    );

    try {
      this._serverProcess = childProcess.spawn(bin, args, { cwd });
    } catch (e) {
      throw new AntError(`Could not spawn server "${bin}"`, e);
    }

    logger.log('Server process successfully spawned');
    logger.log('Waiting for server process events');

    this._serverProcess.stdout.on('data', (data) => {
      data = data.toString();

      console.log(`Server => ${data}`);

      const successMessage = 'GraphQL API server listening for requests on ';

      if (data.includes(successMessage)) {
        logger.log('Success message received');

        const url = data.replace(successMessage, '');

        logger.log(`Opening web browser at ${url}`);

        if (process.platform === 'darwin') {
          childProcess.exec(`open ${url}`);
        } else {
          childProcess.exec(`xdg-open ${url}`);
        }
      }
    });

    this._serverProcess.stderr.on('data', (data) => {
      console.error(`Server => ${data}`);
    });

    const promise = new Promise((resolve, reject) => {
      this._serverProcess.on('error', (err) => {
        const message = `Server process crashed with error "${err}"`;
        logger.log(message);
        logger.log('Stopping service...');
        reject(new AntError(message, err));
      });

      this._serverProcess.on('close', (code) => {
        const message = `Server process closed with code "${code}"`;
        logger.log(message);
        logger.log('Stopping service...');
        if (code === 0) {
          resolve();
        } else {
          reject(new AntError(message));
        }
      });
    });

    await promise;
  }

  /**
   * Adds a Directive entry into the configuration file and saves it.
   * Overrides any Directive entry with the same name.
   *
   * @param {!String} name The directive name
   * @param {!String} definition Directive's GraphQL definition
   * @param {!String} handler The path to the resolver handler
   * @param {String} runtime The runtime to execute the resolver
   * @param {String} config The path to the configuration file
   */
  addDirective(name, definition, handler, runtime, config) {
    config = GraphQL._getConfig(config);

    // Retrieves the plugin configuration node from the Config's YAML document tree.
    // If no configuration node is found, forces its creation and returns it.
    const graphQLNode = config.getPluginConfigurationNode(PLUGIN_DEFAULT_LOCATION, true);

    // Finds the "directives" entry from the configuration node
    let directives = graphQLNode.items.find(
      item => item.key.value === 'directives'
    );
    if (!directives) {
      // If no "directives" entry is found, we must create it in order
      // to add our new directive
      directives = new Map();
      graphQLNode.items.push(new Pair(new Scalar('directives'), directives));
    } else {
      // Since "directives" is a Pair node, we need to access its value
      // to reach the Map of directives
      directives = directives.value;
    }

    // Given the directives map, we need to find the entry whose key is the name
    // of the target directive; either to update it with the new configurations or
    // to know if a brand new entry needs to be created.
    const directive = directives.items.find(
      item => item.key.value === name
    );
    const resolverAttributes = new Map();
    resolverAttributes.items.push(new Pair(new Scalar('handler'), new Scalar(handler)));
    resolverAttributes.items.push(new Pair(new Scalar('runtime'), new Scalar(runtime)));

    const directiveAttributes = new Map();
    directiveAttributes.items.push(new Pair(new Scalar('resolver'), resolverAttributes));
    directiveAttributes.items.push(new Pair(new Scalar('definition'), new Scalar(definition)));
    if (!directive) {
      directives.items.push(new Pair(new Scalar(name), directiveAttributes));
    } else {
      directive.value = directiveAttributes;
    }
    return config.save();
  }

  /**
   * Removes a directive entry from the configuration file
   * and saves it.
   *
   * @param {!String} name The directive name
   * @param {String} config The path to the configuration file
   */
  removeDirective(name, config) {
    config = GraphQL._getConfig(config);

    // Retrieves the plugin configuration node from the Config's YAML document tree
    const graphQLNode = config.getPluginConfigurationNode(PLUGIN_DEFAULT_LOCATION);
    if (!graphQLNode) {
      return;
    }
    // Finds the "directives" entry from the configuration node
    const directives = graphQLNode.items.find(
      item => item.key.value === 'directives'
    );

    // Filters the target directive by its name.
    // Only saves the configuration is any filtering is done.
    let shouldSave = false; 
    directives.value.items = directives.value.items.filter(
      item => {
        if (item.key.value === name) {
          shouldSave = true;
        }
        return item.key.value !== name;
      }
    );
    if (shouldSave) {
      config.save();
    }
  }

  /**
   * Lists all directives registered on the {@link DirectiveController} of
   * this {@link GraphQL} instance.
   */
  listDirectives() {
    console.log('Listing all directives available (<name> <definition> [resolver]):');
    this.directiveController.directives.forEach(directive => {
      console.log(
        `${directive.name} ${directive.definition}${directive.resolver.handler
          ? ` ${directive.resolver.handler}`
          : '' }`
      );
    });
  }

  /**
   * Returns an instance of the provided path configuration or local configuration.
   *
   * @param {String} config The configuration file path
   * @static
   * @private
   * @returns {Config} The configuration instance
   */
  static _getConfig(config) {
    return typeof config === 'string' ? new Config(config) : new Config(Config.GetLocalConfigPath());
  }
}

module.exports = GraphQL;
