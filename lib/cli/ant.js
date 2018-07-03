/* eslint-disable no-console */

/**
 * @fileoverview Main Ant Fn CLI implementation file.
 */

const yargs = require('yargs');

const demandCommandMinMsg = 'You missed the command';
const demandCommandMinMax = 'You can run only one command per call';

module.exports = yargs
  .usage('Usage: $0 [--help] [--version] <command> [<args>]')
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
      console.error(`Fatal: ${msg}`);
      process.exit(1);
    }
  })
  .epilogue('For more information, visit https://github.com/back4app/antfn')
  .locale('en');
