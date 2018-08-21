/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Serverless} plugin class.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs-extra');
const uuidv4 = require('uuid/v4');
const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const Plugin = require('../../Plugin');
const Template = require('../../../templates/Template');
const Provider = require('../../../hosts/providers/Provider');
const AntFunction = require('../../../functions/AntFunction');
const BinFunction = require('../../../functions/BinFunction');

const templates = [
  new Template(
    'Serverless',
    'Default',
    path.resolve(__dirname, '../templates/serverless/default')
  )
];

/**
 * Represents a plugin containing functionalities to deploy Ant Framework's
 * functions using the Serverless framework.
 * @extends Plugin
 */
class Serverless extends Plugin {
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
     * Contains the Serverless plugin providers
     * @type {Array<Provider>}
     * @private
     */
    this._providers = [
      new Provider(
        'Serverless',
        (config, functions) => this._deploy(config, functions)
      )
    ];
  }

  get templates() {
    return templates;
  }

  get providers() {
    return this._providers;
  }

  /**
   * Deploys the passed to a host using the Serverless framework.
   * @param {Object} config The deployment config settings.
   * @param {String} [config.template=Default] The name of the template that
   * will be used to generate the Serverless configuration file.
   * @param {String} [config.profile] The profile to be passed to the provider
   * in the Serverless configuration file.
   * @param {Boolean} [config.keepConfig=false] When set to false (default) the
   * generated Serverless configuration file is deleted after deploying the
   * service.
   * @param {!Array<AntFunction>} functions The functions to be deployed.
   * @async
   * @private
   */
  async _deploy(config, functions) {
    assert(
      !config || typeof config === 'object',
      'Could not deploy functions: param "config" should be Object'
    );
    assert(
      functions instanceof Array,
      'Could not deploy functions: param "functions" should be Array'
    );
    assert(
      functions.length,
      'There are no functions to be deployed'
    );

    functions.forEach(antFunction => assert(
      antFunction instanceof AntFunction,
      `Could not deploy "${antFunction.name || antFunction.constructor.name}" \
function: should be AntFunction`
    ));

    if (!config) {
      config = {};
    }

    const templateName = config.template || 'Default';
    const template = this.ant.templateController.getTemplate(
      'Serverless',
      templateName
    );
    assert(
      template,
      `Could not deploy functions: could not find "${templateName}" template`
    );

    const basePath = path.resolve(
      config.basePath || this._config.basePath || process.cwd(),
      '.serverless'
    );

    const outputPath = path.resolve(
      basePath,
      uuidv4()
    );

    logger.log('Creating Serverless configuration file');
    try {
      fs.ensureDirSync(basePath);
      await template.render(
        outputPath,
        { ant: this.ant, config, functions }
      );
    } catch (e) {
      throw new AntError(
        'Could not create Serverless configuration file',
        e
      );
    }
    logger.log(
      `Serverless configuration file successfully created at "${outputPath}"`
    );

    logger.log('Running Serverless CLI deploy command');
    try {
      const serverlessObservable = (new BinFunction(
        this.ant,
        'serverlessCLI',
        path.resolve(
          __dirname,
          '../node_modules/.bin/serverless'
        )
      )).run(
        ['deploy'],
        { cwd: outputPath }
      );
      await (new Promise((resolve, reject) => {
        serverlessObservable.subscribe(
          data => console.log(data),
          err => reject(err),
          () => resolve()
        );
      }));
    } catch (e) {
      throw new AntError(
        'Could not execute Serverless CLI',
        e
      );
    }
    logger.log('Serverless CLI deploy command successfully executed');

    const keepConfig = config.keepConfig === true;

    if (!keepConfig) {
      logger.log('Deleting Serverless configuration file');
      try {
        fs.removeSync(outputPath);
        logger.log('Serverless configuration file successfully removed');
      } catch (e) {
        logger.error(new AntError(
          `Serverless configuration file could not be removed at "${outputPath}"`,
          e
        ));
      }
    }
  }
}

module.exports = Serverless;
