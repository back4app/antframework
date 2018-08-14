/**
 * @fileoverview Defines and exports the {@link resolve} function.
 */

const path = require('path');
const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const AntError = require('../../../util/AntError');
const logger = require('../../../util/logger');
const LibFunction = require('../../../functions/LibFunction');

/**
 * This function resolves a GraphQL field value.
 */
async function resolve (ant, resolveArgs, fieldArgs, currentValue, model) {
  let field = null;
  if (model) {
    field = model.field;
  }
  if (ant && resolveArgs && resolveArgs.to) {
    let antFunction =  ant.functionController.getFunction(resolveArgs.to);
    if (!antFunction) {
      antFunction = new LibFunction(
        resolveArgs.to,
        path.resolve(
          ant.config.basePath,
          resolveArgs.to
        ),
        ant.runtime
      );
    }
    try {
      currentValue = antFunction.run(
        currentValue !== undefined ? currentValue : fieldArgs
      );
      if (currentValue instanceof Observable) {
        if (
          field &&
          field.astNode &&
          field.astNode.type &&
          field.astNode.type.kind === 'ListType'
        ) {
          return await currentValue.pipe(toArray()).toPromise();
        } else {
          return await currentValue.toPromise();
        }
      } else {
        return currentValue;
      }
    } catch (e) {
      logger.error(new AntError(
        `Could not run "${resolveArgs.to}" function`,
        e
      ));
    }
  }
  return null;
}

module.exports = resolve;
