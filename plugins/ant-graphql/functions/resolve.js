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
      const args = currentValue ||
        (fieldArgs && (!typeof fieldArgs === 'object' || (typeof fieldArgs === 'object' && Object.keys(fieldArgs).length > 0))
          ? fieldArgs
          : undefined);
      currentValue = antFunction.run(args);
      let functionResult;
      if (currentValue instanceof Observable) {
        if (
          field &&
          field.astNode &&
          field.astNode.type &&
          field.astNode.type.kind === 'ListType'
        ) {
          functionResult = await currentValue.pipe(toArray()).toPromise();
        } else {
          functionResult = await currentValue.toPromise();
        }
      } else {
        functionResult = currentValue;
      }
      // Handles Objects in order to avoid GraphQL responding
      // "[object Object]", which is useless
      if (Array.isArray(functionResult)) {
        functionResult = functionResult.map(
          result => typeof result === 'object' ? JSON.stringify(result) : result
        );
      } else if (typeof functionResult === 'object') {
        functionResult = JSON.stringify(functionResult);
      }
      return functionResult;
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
