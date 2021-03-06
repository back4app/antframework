/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link Serverless} plugin class.
 */

const assert = require('assert');
const util = require('util');
const path = require('path');
const fs = require('fs-extra');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const uuidv4 = require('uuid/v4');
const JSZip = require('jszip');
const { AntError, logger } = require('@back4app/ant-util');
const {
  AntFunction,
  BinFunction,
  Provider,
  Template,
  Plugin
} = require('@back4app/ant');

const templates = [
  new Template(
    'Serverless',
    'Default',
    path.resolve(__dirname, '../templates/serverless/default')
  )
];

/**
 * @class ant-serverless/Serverless
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

    if (!this._config) {
      this._config = {};
    }

    /**
     * Contains the Serverless plugin providers.
     * @type {Array<Provider>}
     * @private
     */
    this._providers = [
      new Provider(
        'Serverless',
        (config, functions) => this.deploy(config, functions)
      )
    ];

    /**
     * Contains the {@link BinFunction} to execute the Serverless CLI commands.
     * @type {BinFunction}
     * @private
     */
    this._serverlessCLI = new BinFunction(
      this.ant,
      'serverlessCLI',
      path.resolve(
        path.dirname(require.resolve('serverless')),
        '../../.bin/serverless'
      )
    );

    /**
     * Contains the {@link BinFunction} to install Ant Framework using npm.
     * @type {BinFunction}
     * @private
     */
    this._installAnt = new BinFunction(
      this._ant,
      'installAnt',
      'npm'
    );
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
   */
  async deploy(config, functions) {
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

    const servicePath =
      config.basePath ||
      this._config.basePath ||
      process.cwd();

    const basePath = path.resolve(
      servicePath,
      '.serverless'
    );

    const outputPath = path.resolve(
      basePath,
      uuidv4()
    );

    functions.forEach(antFunction => {
      antFunction.handlerFileName = antFunction.handler.split('/').pop();
    });

    logger.log('Rendering Serverless template');
    try {
      fs.ensureDirSync(basePath);
      await template.render(
        outputPath,
        { ant: this.ant, config, functions }
      );
    } catch (e) {
      throw new AntError(
        'Could not render Serverless template',
        e
      );
    }
    logger.log(
      `Serverless template rendering successfully completed at "${outputPath}"`
    );

    logger.log('Copying service configuration files');
    try {
      fs.copyFileSync(
        path.resolve(
          servicePath,
          './ant.yml'
        ),
        path.resolve(
          outputPath,
          './ant.yml'
        )
      );
      fs.copyFileSync(
        path.resolve(
          servicePath,
          './model.graphql'
        ),
        path.resolve(
          outputPath,
          './model.graphql'
        )
      );
      logger.log('Service configuration files successfully copied');
    } catch (e) {
      throw new AntError(
        'Could not copy service configuration files',
        e
      );
    }
    logger.log('Service configuration files successfully copied');

    logger.log('Installing dependencies');
    try {
      await (new Promise((resolve, reject) => {
        this._installAnt.run(
          [
            'install'
          ],
          { cwd: outputPath }
        ).subscribe(
          data => logger.log(data),
          err => reject(err),
          () => resolve()
        );
      }));
    } catch (e) {
      throw new AntError(
        'Could not install dependencies',
        e
      );
    }
    logger.log('Dependencies successfully installed');

    for (const antFunction of functions) {
      logger.log(`Creating "${antFunction.name}" function's artifact`);
      try {
        const zip = new JSZip();
        zip.file(
          antFunction.handlerFileName,
          await readFile(antFunction.handler, 'utf8')
        );
        zip.file(
          'libFunction.js',
          await readFile(
            path.resolve(
              outputPath,
              './libFunction.js'
            ),
            'utf8'
          )
        );
        await writeFile(
          path.resolve(
            outputPath,
            `${antFunction.name}.zip`
          ),
          await zip.generateAsync({
            type: 'uint8array',
            platform: process.platform
          })
        );
        logger.log('Artifact successfully created');
      } catch (e) {
        throw new AntError(
          `Could not generate "${antFunction.name}" function's artifact`,
          e
        );
      }
    }

    logger.log('Running Serverless CLI deploy command');
    try {
      const serverlessObservable = this._serverlessCLI.run(
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
      logger.log('Deleting Serverless configuration files');
      try {
        fs.removeSync(outputPath);
        logger.log('Serverless configuration files successfully removed');
      } catch (e) {
        logger.error(new AntError(
          `Serverless configuration files could not be removed at \
"${outputPath}"`,
          e
        ));
      }
    }
  }
}

module.exports = Serverless;
