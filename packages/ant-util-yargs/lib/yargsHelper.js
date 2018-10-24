/* eslint-disable no-console */

/**
 * Exports util functions to help leading with
 * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} objects.
 * @module ant-util-yargs/yargsHelper
 */

const { Analytics } = require('@back4app/ant-util-analytics');

/**
 * Flag indicating the Yargs error was previously handled
 * by any error handler attached by this utils.
 */
let errorHandled = false;

/**
 * Helper function that can be used to get the CLI file name.
 * @return {String} The name of CLI file that is being executed.
 */
function getCliFileName() {
  return process.argv.length > 1 ? process.argv[1].split('/').pop() : 'ant';
}

/**
 * Helper function that can be used to check if the CLI is running on verbose
 * mode.
 * @return {Boolean} Return true if running on verbose mode.
 */
function isVerboseMode() {
  return process.argv.includes('--verbose') || process.argv.includes('-v');
}

/**
 * Helper function that can be used to handle and print error messages occurred
 * during Yargs parsing and execution.
 * @param {String} msg The error message.
 * @param {Error} err The error that generated the problem.
 * @param {String} command The command that failed.
 * @param {Boolean} exitProcess Flag indicating it should invoke process.exit
 * after logging error messages.
 * @returns {Promise} The error tracking request promise
 */
function handleErrorMessage (msg, err, command, exitProcess) {
  this.setErrorHandled();
  console.error(`Fatal => ${msg}`);
  if (err) {
    console.error();
    if (isVerboseMode()) {
      console.error('Error stack:');
      console.error(err.stack);
    } else {
      console.error('For getting the error stack, use --verbose option');
    }
  }
  console.error();
  console.error('For getting help:');
  console.error(
    `${getCliFileName()} --help ${command ? command : '[command]'}`
  );
  if (!err && msg) {
    err = new Error(msg);
  }
  if (!exitProcess) {
    return Analytics.trackError(err).then(() => process.exit(1));
  }
  process.exit(1);
}

/**
 * Attaches an error handler into the Yargs instance.
 *
 * Guarantees the single error handling with the `errorHandled` flag,
 * which can be set with the `setErrorHandled` function.
 *
 * @param {!Yargs} yargs The [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js}
 * instance.
 * @param {!Function} handler The error handler
 */
function attachFailHandler (yargs, handler) {
  yargs.fail((msg, err, usage) => {
    // If failure was handled previously, does nothing.
    if (errorHandled) {
      return;
    }
    handler(msg, err, usage);
    if (errorHandled) {
      // Workaround to avoid yargs from running the command.
      // Since yargs has no mechanisms to any error handler
      // alert the command execution needs to be stopped, and we can't
      // exit the process right away due to possible asynchronous
      // error handlers, we need a way to prevent the command to be
      // ran, since we are handling the error asynchronously.
      // Setting this inner flag will prevent yargs to run the command.
      yargs._setHasOutput();
    }
  });
}

/**
 * Sets the `errorHandled` flag with `true`, indicating
 * the error has been handled.
 * This flag prevents next error handlers attached by
 * the `attachFailHandler` function to be executed.
 */
function setErrorHandled () {
  errorHandled = true;
}

/**
 * Resets the `errorHandled` flag, allowing
 * next error handlers attached by the `attachFailHandler`
 * function to be executed.
 */
function _resetHandler () {
  errorHandled = false;
}

module.exports = { getCliFileName, isVerboseMode, handleErrorMessage, attachFailHandler, setErrorHandled, _resetHandler };
