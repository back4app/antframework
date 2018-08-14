/**
 * @fileoverview Defines and exports the {@link resolve} function.
 */

const path = require('path');
const { Observable } = require('rxjs');
const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const LibFunction = require('../../../functions/LibFunction');

/**
 * This function resolves a GraphQL field value.
 */
function resolve (ant, mockArgs, fieldArgs, currentValue) {
  if (ant && mockArgs && mockArgs.to) {
    let antFunction =  ant.functionController.getFunction(mockArgs.to);
    if (!antFunction) {
      antFunction = new LibFunction(
        mockArgs.to,
        path.resolve(
          ant.config.basePath,
          mockArgs.to
        ),
        ant.runtime
      );
    }
    try {
      currentValue = antFunction.run(
        currentValue !== undefined ? currentValue : fieldArgs
      );
      if (currentValue instanceof Observable) {
        return currentValue.toPromise();
      } else {
        return currentValue;
      }
    } catch (e) {
      logger.error(new AntError(
        `Could not run "${mockArgs.to}" function`,
        e
      ));
    }
  }
  return null;
}

module.exports = resolve;
