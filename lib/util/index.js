/**
 * Exports the {@link AntError} class, the {@link Logger} singleton instance and
 * the [antframework/lib/util/yargsHelper]{@link module:antframework/lib/util/yargsHelper}
 * module.
 * @module antframework/lib/util
 */

const AntError = require('./AntError');
const logger = require('./logger');
const yargsHelper = require('./yargsHelper');

module.exports.AntError = AntError;
module.exports.logger = logger;
module.exports.yargsHelper = yargsHelper;
