/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link AntCli} class.
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const yargs = require('yargs');
const AntError = require('../util/AntError');
const Ant = require('../Ant');
const logger = require('../util/logger');

const demandCommandMinMsg = 'You missed the command';
const demandCommandMinMax = 'You can run only one command per call';

/**
 * Represents the Ant Framework CLI - Command Line Interface.
 * @example
 * <caption>Usage</caption>
 * (new AntCli()).execute()
 */
class AntCli {
  /**
  * TODO Improve config system: merge, parameter and require base path.
  * @throws {AntError} If the local config file cannot be read.
  */
  constructor() {
    /**
     * Contains the {@link Ant} instance created during the CLI initilization.
     * @type {Ant}
     * @private
     */
    this._ant = new Ant(this._getAntConfig());

    this._loadYargs();
  }

  /**
   * Gets the config object to be used for the Ant Framework loading.
   * @returns {Object} The config to be used for loading the Ant Framework.
   * @throws {AntError} If the local config file cannot be read.
   * @private
   */
  _getAntConfig() {
    let config = null;
    const configPath = path.resolve(process.cwd(), 'ant.yml');
    if (fs.existsSync(configPath)) {
      try {
        config = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        throw new AntError(
          `Could not load config ${configPath}`,
          e
        );
      }
      if (!config) {
        config = {};
      }
    }
    return config;
  }

  /**
  * Loads the Yargs object.
  * @private
  */
  _loadYargs() {
    /**
     * Contains the Yargs object created during the CLI initilization.
     * @type {Object}
     * @private
     */
    this._yargs = yargs.usage(
      'Usage: $0 [--help] [--version] [--verbose] <command> [<args>] \
[<options>]'
    )
      .strict()
      .demandCommand(1, 1, demandCommandMinMsg, demandCommandMinMax)
      .recommendCommands()
      .help().alias('help', 'h')
      .version()
      .options('verbose', {
        alias: 'v',
        describe: 'Show execution logs and error stacks',
        type: 'boolean',
        default: false
      })
      .locale('en');

    this._loadYargsMiddlewares();

    this._loadYargsEpilogue();

    this._loadYargsFailHandler();

    this._loadPluginsYargsSettings();
  }

  /**
   * Loads the Yargs middlewares.
   * @private
   */
  _loadYargsMiddlewares() {
    this._yargs.middleware([argv => {
      if (argv.verbose) {
        logger.attachHandler(console.log);
      }
    }]);
  }

  /**
  * Loads the Yargs' epilogue message.
  * @private
  */
  _loadYargsEpilogue() {
    let epilogue =
      'For more information, visit https://github.com/back4app/antframework';

    let plugins = this._ant.pluginController.plugins.map(
      plugin => this._ant.pluginController.getPluginName(plugin)
    ).join(', ');

    if (
      this._ant.pluginController.loadingErrors &&
      this._ant.pluginController.loadingErrors.length
    ) {
      const verbose =
        process.argv.includes('--verbose') ||
        process.argv.includes('-v');

      let loadingErrors = this._ant.pluginController.loadingErrors;

      if (verbose) {
        loadingErrors = loadingErrors.map(loadingError => loadingError.stack);
      }

      loadingErrors = loadingErrors.join('\n');

      plugins = plugins.concat(`

There were some errors when loading the plugins:
${loadingErrors}`);

      if (!verbose) {
        plugins = plugins.concat(
          '\n\nFor getting the error stack, use --verbose option'
        );
      }
    }

    if (plugins) {
      epilogue =
`Plugins:
  ${plugins}

${epilogue}`;
    }

    this._yargs.epilogue(epilogue);
  }

  /**
   * Loads the Yargs fail handler.
   * @private
   */
  _loadYargsFailHandler() {
    this._yargs.fail((msg, err, yargs) => {
      const argv = this._yargs.parsed.argv;

      if (err) {
        if (
          err.name === 'YError' &&
          err.message.indexOf('Not enough arguments following: ') === 0
        ) {
          msg = err.message;
        } else {
          throw err;
        }
      }

      if (msg === demandCommandMinMsg) {
        console.log(yargs.help());
        process.exit(0);
      } else {
        if (msg.indexOf('Unknown argument: ') === 0) {
          msg = msg.replace('argument', 'command');
        }
        console.error(`Fatal => ${msg}`);
        console.error();
        console.error('For getting help:');
        console.error(`${argv.$0.split('/').pop()} --help [command]`);
        process.exit(1);
      }
    });
  }

  /**
  * Loads the Yargs settings specific of each loaded plugin.
  * @private
  */
  _loadPluginsYargsSettings() {
    for (const plugin of this._ant.pluginController.plugins) {
      this._ant.pluginController.loadPluginYargsSettings(plugin, this._yargs);
    }
  }

  /**
  * Executes the CLI program.
  */
  execute() {
    this._yargs.argv;
  }
}

module.exports = AntCli;
