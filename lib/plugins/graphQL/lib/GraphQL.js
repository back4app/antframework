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
      this._config && this._config.directives ?
        this._config.directives :
        undefined
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
      async () => {
        try {
          await this.startService();
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
   * Contains the {@link DirectiveController} instance created during the plugin
   * initialization.
   * @type {DirectiveController}
   * @readonly
   */
  get directiveController() {
    return this._directiveController;
  }

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
        return fs.readFileSync(modelPath, 'utf8');
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
}

module.exports = GraphQL;
