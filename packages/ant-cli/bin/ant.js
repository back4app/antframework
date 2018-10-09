#!/usr/bin/env node

/**
 * @fileoverview This is the executable bin file for the Ant Framework CLI -
 * Command Line Interface. It initializes and executes an instance of the
 * {@link AntCli} class.
 */
const { Analytics } = require('@back4app/ant-util-analytics');

const PARSE_APP_ID = 'imEOoRE7JZ48gjNYpaVlLa09W2ooorO7qwiTNlhO';
const JAVASCRIPT_KEY = 'TO39FVsMIND78n5UNxUH6zjP00EJjus2nS7awkO8';
const SENTRY_DSN = 'https://871fb10cedd145138c530f990bb4f0e0@sentry.io/1285966';
if (!process.argv.includes('--no-tracking')) {
  Analytics.initialize(PARSE_APP_ID, JAVASCRIPT_KEY, SENTRY_DSN);
} else {
  process.argv.splice(process.argv.indexOf('--no-tracking'), 1);
}

const AntCli = require('../lib/AntCli.js');
const antCli = new AntCli();
antCli.execute();
