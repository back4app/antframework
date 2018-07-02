/* eslint-disable no-console */

/**
 * @fileoverview Main Ant Fn CLI implementation file.
 */

const yargs = require('yargs');

yargs
  .usage('ant <cmd> [args]')
  .help()
  .argv;
