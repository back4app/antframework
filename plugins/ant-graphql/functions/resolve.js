/**
 * @fileoverview Defines and exports the {@link resolve} function.
 */

const { Observable } = require('rxjs');
const { toArray } = require('rxjs/operators');
const { AntError, logger } = require('@back4app/ant-util');

/**
 * This function resolves a GraphQL field value.
 */
async function resolve (ant, resolveArgs, fieldArgs, currentValue, model) {
  let field = null;
  if (model) {
    field = model.field;
  }
  if (ant && resolveArgs && resolveArgs.to) {
    const antFunction =  ant.functionController.getFunction(resolveArgs.to);
    if (!antFunction) {
      logger.error(new AntError(
        `Could not find "${resolveArgs.to}" function`
      ));
      return null;
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
