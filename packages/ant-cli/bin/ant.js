#!/usr/bin/env node

/**
 * @fileoverview This is the executable bin file for the Ant Framework CLI -
 * Command Line Interface. It initializes and executes an instance of the
 * {@link AntCli} class.
 */
const { Analytics } = require('@back4app/ant-util-analytics');
const path = require('path');

const parseAppId = 'imEOoRE7JZ48gjNYpaVlLa09W2ooorO7qwiTNlhO';
const parseJsKey = 'TO39FVsMIND78n5UNxUH6zjP00EJjus2nS7awkO8';
const parseServerUrl = 'https://parseapi.back4app.com/';
// Same directory as globalConfig.yml file
const parseStorageFilePath = path.resolve(__dirname, '../../ant/lib/ant-storage.json');
const sentryDsn = 'https://871fb10cedd145138c530f990bb4f0e0@sentry.io/1285966';

if (!process.argv.includes('--no-tracking')) {
  Analytics.initialize({ parseAppId, parseJsKey, parseServerUrl, parseStorageFilePath, sentryDsn });
} else {
  process.argv.splice(process.argv.indexOf('--no-tracking'), 1);
}

const AntCli = require('../lib/AntCli.js');
const antCli = new AntCli();
antCli.execute();
