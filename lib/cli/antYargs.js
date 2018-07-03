/* eslint-disable no-console */

/**
 * @fileoverview This module loads and exports a
 * [yargs]{@link https://github.com/yargs/yargs} object that implements the
 * expected behavior for the Ant Fn CLI.
 */

const yargs = require('yargs');

const demandCommandMinMsg = 'You missed the command';
const demandCommandMinMax = 'You can run only one command per call';

const antYargs = yargs
  .usage('Usage: $0 [--help] [--version] <command> [<args>]')
  .command('somecommand')
  .strict()
  .demandCommand(1, 1, demandCommandMinMsg, demandCommandMinMax)
  .recommendCommands()
  .help().alias('help', 'h')
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
  .epilogue('For more information, visit https://github.com/back4app/antfn')
  .locale('en');

module.exports = antYargs;
