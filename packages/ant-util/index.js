/**
 * Exports the {@link AntError} class and the {@link Logger} singleton instance.
 * @module ant-util
 */

const AntError = require('./lib/AntError');
const logger = require('./lib/logger');

module.exports = {
  AntError,
  logger
};
