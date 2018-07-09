#!/usr/bin/env node

/**
 * @fileoverview This is the executable bin file for the Ant Framework CLI -
 * Command Line Interface. It initializes and executes an instance of the
 * {@link AntCli} class.
 */

const AntCli = require('../lib/cli/AntCli.js');

const antCli = new AntCli();
antCli.execute();
