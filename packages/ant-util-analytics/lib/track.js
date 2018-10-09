/**
 * @fileoverview Module to be ran when tracking
 * events on a separate process, in order to avoid
 * blocking the main process with the request
 * to the analytics server.
 */
const Analytics = new (require('./Analytics'))();

const data = process.argv[2];
const config = JSON.parse(process.argv[3]);

// It is needed to initialize because this is supposed to
// run on a separate process.
Analytics.initialize(config);
Analytics.trackCommand(JSON.parse(data));
