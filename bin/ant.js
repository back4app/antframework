#!/usr/bin/env node

/**
 * @fileoverview This is the executable bin file for the Ant Framework CLI.
 */

const AntCli = require('../lib/cli/AntCli.js');

const antCli = new AntCli();
antCli.execute();
