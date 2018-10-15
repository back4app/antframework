/**
 * @fileoverview Module to be ran when tracking
 * events on a separate process, in order to avoid
 * blocking the main process with the request
 * to the analytics server.
 */
const Analytics = require('./Analytics');

const args = process.argv[2];
Analytics.trackCommand(JSON.parse(args));
