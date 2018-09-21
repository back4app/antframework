/**
 * @fileoverview Defines and exports the {@link AntError} class.
 */

/**
 * @class ant-util/AntError
 * Representes the errors that are thrown by the Ant Framework.
 * @extends Error
 */
class AntError extends Error {
  /**
   * @param {String} message The error message.
   * @param {Error} innerError The inner error which originally generated the
   * current error.
   */
  constructor(message, innerError) {
    super(message);

    if(innerError) {
      this.stack = `${this.stack}\n\nInner error => ${innerError.stack}`;
    }
  }
}

module.exports = AntError;
