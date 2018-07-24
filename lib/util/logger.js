/**
 * @fileoverview Defines the {@link Logger} class and exports a singleton
 * instance of it.
 */

const assert = require('assert');

/**
 * Represents a logger utility that has a set of handlers and calls each of them
 * when a new entry is aimed to be logged.
 */
class Logger {
  constructor() {
    /**
     * Contains the logger handlers.
     * @type {Set}
     * @private
     */
    this._handlers = new Set();
  }

  /**
   * Attaches a new handler to the logger handlers set.
   * @param {!Function} handler The handler to be attached.
   * @throws {AssertionError} If the handler is not a function.
   */
  attachHandler(handler) {
    assert(
      typeof handler === 'function',
      'Could not attach handler: param "handler" should be Function'
    );
    this._handlers.add(handler);
  }

  /**
   * Logs a log entry by calling each of the attached handlers.
   * @param {*} entry The entry to be logged.
   */
  log(entry) {
    this._handlers.forEach(handler => handler(entry));
  }
}

module.exports = new Logger();
