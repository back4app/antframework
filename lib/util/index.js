/**
 * Exports the {@link AntError} class and the {@link Logger} singleton instance.
 * @module antframework/lib/util
 */

const AntError = require('./AntError');
const logger = require('./logger');

module.exports.AntError = AntError;
module.exports.logger = logger;
