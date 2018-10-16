/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link AntCli} class.
 */

const fs = require('fs');
const yargs = require('yargs');
const { AntError, logger } = require('@back4app/ant-util');
const { yargsHelper } = require('@back4app/ant-util-yargs');
const { Ant, Config } = require('@back4app/ant');
const { Analytics } = require('@back4app/ant-util-analytics');

const demandCommandMinMsg = 'You missed the command';
const demandCommandMinMax = 'You can run only one command per call';

/**
 * @class ant-cli/AntCli
 * Represents the Ant Framework CLI - Command Line Interface.
 * @example
 * <caption>Usage</caption>
 * (new AntCli()).execute()
 */
class AntCli {
  /**
   * @throws {AntError} If the local config file cannot be read.
   */
  constructor() {
    try {
      /**
       * Contains the Ant framework local config.
       * @type {Config}
       * @private
       */
      this._config = this._getAntConfig();
      Analytics.addBreadcrumb('Ant CLI --config loaded', { config: this._config });

      /**
       * Contains the {@link Ant} instance created during the CLI initilization.
       * @type {Ant}
       * @private
       */
      this._ant = new Ant(this._config ? this._config.config : null);

      this._loadYargs();
    } catch (err) {
      yargsHelper.handleErrorMessage(err.message, err);
    }
  }

  /**
   * Gets the config object to be used for the Ant Framework loading.
   * @returns {Object} The config to be used for loading the Ant Framework.
   * @throws {AntError} If the local config file cannot be read, or --config
   * does not have "path" argument.
   * @private
   */
  _getAntConfig() {
    let configPath = null;
    let config = null;
    let configPathIndex = null;
    configPathIndex = process.argv.indexOf('--config') + 1;
    if (!configPathIndex) {
      configPathIndex = process.argv.indexOf('-c') + 1;
    }
    if (configPathIndex) {
      if (process.argv.length <= configPathIndex) {
        throw new AntError('Config option requires path argument');
      } else {
        configPath = process.argv[configPathIndex];
      }
    } else {
      configPath = Config.GetLocalConfigPath();
      if (!fs.existsSync(configPath)) {
        configPath = null;
      }
    }
    if (configPath) {
      config = new Config(configPath);
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
    this._yargs = yargs;
    this._yargs.usage(
      'Usage: $0 [--help] [--version] [--config <path>] [--verbose] <command> [<args>] \
[<options>]'
    )
      .strict()
      .demandCommand(1, 1, demandCommandMinMsg, demandCommandMinMax)
      .recommendCommands()
      .help().alias('help', 'h')
      .version()
      .config('config', 'Path to YAML config file', () => {
        return { configPath: this._config ? this._config._path : null };
      }).alias('config', 'c')
      .options('configPath', {
        describe: 'Set the CLI configuration settings',
        default: this._config ? this._config._path : null,
        hidden: true
      })
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
    this._yargs.middleware([
      argv => {
        if (argv.verbose) {
          logger.attachHandler(console.log);
          logger.attachErrorHandler(console.error);
        }
      },
      argv => Analytics.spawnTrackingProcess(argv)
    ]);
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
      let loadingErrors = this._ant.pluginController.loadingErrors;

      if (yargsHelper.isVerboseMode()) {
        loadingErrors = loadingErrors.map(loadingError => loadingError.stack);
      }

      loadingErrors = loadingErrors.join('\n');

      plugins = plugins.concat(`

There were some errors when loading the plugins:
${loadingErrors}`);

      if (!yargsHelper.isVerboseMode()) {
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
    yargsHelper.attachFailHandler(this._yargs, (msg, err, yargs) => {
      if (err) {
        if (
          err.name === 'YError' &&
          err.message.indexOf('Not enough arguments following: ') === 0
        ) {
          msg = err.message;
        } else {
          yargsHelper.handleErrorMessage(err.message, err);
        }
      }

      if (msg === demandCommandMinMsg) {
        console.log(yargs.help());
        process.exit(0);
      } else {
        if (msg.indexOf('Unknown argument: ') === 0) {
          msg = msg.replace('argument', 'command');
        }
        yargsHelper.handleErrorMessage(msg, err, undefined, true);
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
    if (this._yargs) {
      Analytics.addBreadcrumb('Running Ant CLI', { argv: process.argv });
      this._yargs.argv;
    }
  }
}

module.exports = AntCli;
