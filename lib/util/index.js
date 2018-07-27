/**
 * Exports the {@link AntError} class, the {@link config} util module, the {@link Logger}
 * singleton instance and the [antframework/lib/util/yargsHelper]
 * {@link module:antframework/lib/util/yargsHelper} module.
 * @module antframework/lib/util
 */

const AntError = require('./AntError');
const config = require('./config');
const logger = require('./logger');
const yargsHelper = require('./yargsHelper');

module.exports = {
  AntError,
  config,
  logger,
  yargsHelper
};
