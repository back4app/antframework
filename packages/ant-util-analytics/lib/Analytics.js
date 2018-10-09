/**
 * @fileoverview The analytics module, which is responsible
 * for tracking the framework usage and any errors thrown
 * during its execution, in order to trace and solve any
 * bugs found as soon as possible.
 *
 * @module antframework/lib/analytics/Analytics
 */
const assert = require('assert');
const child_process = require('child_process');
const Parse = require('parse/node');
const path = require('path');
const Sentry = require('@sentry/node');

/**
 * Constant to hold the events name
 */
const EVENT = {
  COMMAND_RUN: 'command_run'
};

/**
 * Initializes the Parse and Sentry analytics API.
 *
 * @param {String} parseAppId The ID of the Parse application that
 * is going to register the analytics data
 * @param {String} parseJsKey The key needed in order to get access to
 * the Parse Javascript API
 * @param {String} sentryDsn The Sentry DSN, needed to initialize the
 * Sentry API
 */
function initialize(parseAppId, parseJsKey, sentryDsn) {
  if (parseAppId && parseJsKey) {
    Parse.serverURL = 'https://parseapi.back4app.com/';
    Parse.initialize(parseAppId, parseJsKey);
  }
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn
    });
  }
}

/**
 * Spawns a child process which will be responsible for sending
 * the tracking data to the analytics server.
 * It is required to spawn a new process in order to avoid
 * blocking the parent process exit when the tracking request is
 * still pending, or in a offline use case of this framework.
 *
 * @param {Object} data The event data to be sent to Back4App analytics
 */
function spawnTrackingProcess(data) {
  // If Parse is not initialized, do nothing
  if (!Parse.applicationId) {
    return;
  }
  // Creates the process detached from the parent process,
  // in order to send our tracking request
  const args = [ JSON.stringify(data) ];
  child_process.fork(
    path.resolve(__dirname, 'track.js'),
    args,
    {
      detached: true,
      stdio: 'ignore'
    }
  ).unref();
}

/**
 * Tracks the `command_run` event.
 *
 * @param {Object} data The event data to be sent to Back4App analytics
 * @returns {Promise} The event tracking request {@link Promise}
 */
function trackCommand(data) {
  assert(!data || typeof data === 'object',
    'Param "data" must be an object');
  const dimensions = {};
  if (data) {
    // Keys with special characters are not supported by Parse
    const supportedEntries = Object.entries(data).filter(
      ([key]) => /^\w+/.test(key)
    );
    for(const [key, value] of supportedEntries) {
      let dimensionValue;
      if (typeof value === 'function') {
        dimensionValue = '';
      } else if (typeof value === 'undefined') {
        dimensionValue = 'undefined';
      } else if (typeof value === 'object' || typeof value === 'symbol') {
        dimensionValue = JSON.stringify(value);
      } else {
        dimensionValue = value.toString();
      }
      // Parse dimensions only accepts String keys and values
      dimensions[key] = dimensionValue;
    }
  }
  return Parse.Analytics.track(EVENT.COMMAND_RUN, dimensions);
}

/**
 * Tracks an {@link Error} and sends it to Sentry servers
 * with all previously added breadcrumbs.
 *
 * @see {@link https://docs.sentry.io/learn/draining} for more
 * info about shutting down Sentry client.
 *
 * @param {!Error} err The error to be tracked
 */
function trackError(err) {
  Sentry.captureException(err);
  // Returns a promise that will be resolved in 2000ms,
  // which is the timeout to resolve all pending communication
  // with Sentry servers.
  // @see https://docs.sentry.io/learn/draining
  const client = Sentry.getCurrentHub().getClient();
  if (!client) {
    // In case Sentry was not initialized
    return Promise.resolve();
  }
  return client.close(2000);
}

/**
 * Adds a breadcrumb to the next event to be sent to Sentry.
 * Notice that invoking this will not actually send the breadcrumb
 * to Sentry servers. It will only be sent together with an event
 * (an exception or custom event).
 *
 * @see {@link https://docs.sentry.io/learn/breadcrumbs} for more info.
 *
 * @param {!String} message The breadcrumb message.
 * @param {Object} data The additional information to be sent to Sentry.
 * @param {String} category The breadcrumb category.
 * @param {String} level The breacrumb level, which may be `fatal`, `error`,
 * `warning`, `info` or `debug`.
 */
function addBreadcrumb(message, data, category = 'Initialization', level = 'info') {
  Sentry.addBreadcrumb({
    message,
    data,
    category,
    level
  });
}

module.exports = {
  initialize,
  spawnTrackingProcess,
  trackCommand,
  trackError,
  addBreadcrumb
};
