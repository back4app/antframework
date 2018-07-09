/* eslint-disable no-console */

/**
 * @fileoverview Defines and exports the {@link AntCli} class.
 */

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
  * @throws {Error} If the default config file cannot be read.
  */
  constructor() {
    const ant = new Ant();

    const demandCommandMinMsg = 'You missed the command';
    const demandCommandMinMax = 'You can run only one command per call';

    let epilogue =
      'For more information, visit https://github.com/back4app/antframework';
    let plugins = ant.pluginController.plugins.map(
      plugin => ant.pluginController.getPluginName(plugin)
    ).join(', ');
    if (
      ant.pluginController.loadingErrors &&
      ant.pluginController.loadingErrors.length
    ) {
      plugins = plugins.concat(`
There were some errors when loading the plugins:
${ant.pluginController.loadingErrors.join('\n')}`);
    }
    if (plugins) {
      epilogue =
`Plugins:
${plugins}

${epilogue}`;
    }

    this._yargs = yargs
      .usage('Usage: $0 [--help] [--version] <command> [<args>]')
      .command('somecommand')
      .strict()
      .demandCommand(1, 1, demandCommandMinMsg, demandCommandMinMax)
      .recommendCommands()
      .help().alias('help', 'h')
      .epilogue(epilogue)
      .version().alias('version', 'v')
      .fail((msg, err, yargs) => {
        if (err) {
          throw err;
        }
        if (msg === demandCommandMinMsg) {
          console.log(yargs.help());
          process.exit(0);
        } else {
          console.error(`Fatal => ${msg}`);
          process.exit(1);
        }
      })
      .locale('en');
  }

  /**
  * Executes the CLI program.
  */
  execute() {
    this._yargs.argv;
  }
}

module.exports = AntCli;
