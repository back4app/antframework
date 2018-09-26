/**
 * @fileoverview Defines and exports the {@link subscribe} function.
 */

const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const { Observable } = require('rxjs');
const AsyncIterableObserver = require('../lib/util/AsyncIterableObserver');

/**
 * This function resolves a GraphQL @subscribe directive value.
 */
async function subscribe (ant, field, directiveArgs, fieldArgs) {
  if (ant && field && directiveArgs && directiveArgs.to) {
    const antFunction =  ant.functionController.getFunction(directiveArgs.to);
    if (!antFunction) {
      logger.error(new AntError(
        `Could not find "${directiveArgs.to}" function`
      ));
      return null;
    }
    try {
      const currentValue = antFunction.run(fieldArgs);
      if (currentValue instanceof Observable) {
        return new AsyncIterableObserver(field.fieldName, currentValue);
      }
      return currentValue;
    } catch (e) {
      logger.error(new AntError(
        `Could not run "${directiveArgs.to}" function`,
        e
      ));
    }
  }
  return null;
}

module.exports = subscribe;
