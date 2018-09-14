/* eslint-disable no-console */

/**
 * Exports util functions to help leading with
 * [Yargs]{@link https://github.com/yargs/yargs/blob/master/yargs.js} objects.
 * @module antframework/lib/util/yargsHelper
 */

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
 */
function handleErrorMessage (msg, err, command) {
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
  process.exit(1);
}

/**
 * Helper function encapsulates an asynchronous function to be executed
 * and handled on any errors thrown, providing a friendly error message
 * based on the command that this function represents.
 * In case of success, the process is exit with code 0.
 * In case of failure, the process is exit with code 1.
 *
 * @param {!String} command The command about to be executed
 * @param {!Function} asyncFn The asynchronous function to be executed
 */
async function executeCommand(command, asyncFn) {
  try {
    await asyncFn();
    process.exit(0);
  } catch (e) {
    handleErrorMessage(e.message, e, command);
  }
}

module.exports = { getCliFileName, isVerboseMode, handleErrorMessage, executeCommand };
