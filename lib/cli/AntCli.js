/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link AntCli} class.
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const yargs = require('yargs');
const Ant = require('../Ant');

/**
 * Represents the Ant Framework CLI - Command Line Interface.
 * @example
 * <caption>Usage</caption>
 * (new AntCli()).execute()
 */
class AntCli {
  /**
  * TODO Improve componentization
  * TODO Improve config systema
  * @throws {Error} If the default config file cannot be read.
  */
  constructor() {
    let config = null;
    const configPath = path.resolve(process.cwd(), 'ant.yml');
    if (fs.existsSync(configPath)) {
      try {
        config = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
        if (!config) {
          config = {};
        }
      } catch (e) {
        throw new Error(
          `Could not load config ${configPath}: ${e}`
        );
      }
    }

    /**
     * Contains the {@link Ant} instance created during the CLI initilization.
     * @type {Ant}
     * @private
     */
    this._ant = new Ant(config);

    const demandCommandMinMsg = 'You missed the command';
    const demandCommandMinMax = 'You can run only one command per call';

    /**
     * Contains the Yargs object created during the CLI initilization.
     * @type {Object}
     * @private
     */
    this._yargs = yargs.usage(
      'Usage: $0 [--help] [--version] <command> [<args>] [<options>]'
    )
      .strict()
      .demandCommand(1, 1, demandCommandMinMsg, demandCommandMinMax)
      .recommendCommands()
      .help().alias('help', 'h')
      .version().alias('version', 'v')
      .fail((msg, err, yargs) => {
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
          console.error('');
          console.error('For getting help:');
          console.error(`${argv.$0.split('/').pop()} --help [command]`);
          process.exit(1);
        }
      })
      .locale('en');

    this._loadPluginsYargsSettings();

    this._loadEpilogue();
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
  * Loads the Yargs' epilogue message.
  * @private
  */
  _loadEpilogue() {
    let epilogue =
      'For more information, visit https://github.com/back4app/antframework';

    let plugins = this._ant.pluginController.plugins.map(
      plugin => this._ant.pluginController.getPluginName(plugin)
    ).join(', ');

    if (
      this._ant.pluginController.loadingErrors &&
      this._ant.pluginController.loadingErrors.length
    ) {
      plugins = plugins.concat(`
There were some errors when loading the plugins:
${this._ant.pluginController.loadingErrors.join('\n')}`);
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
  * Executes the CLI program.
  */
  execute() {
    this._yargs.argv;
  }
}

module.exports = AntCli;
