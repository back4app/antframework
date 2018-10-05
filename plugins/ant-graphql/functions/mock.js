/**
 * @fileoverview Defines and exports the {@link mock} function.
 */

const Mustache = require('mustache');
const { AntError, logger } = require('@back4app/ant-util');

/**
 * This function mocks a GraphQL field value.
 */
function mock (_, mockArgs, fieldArgs, currentValue) {
  if (currentValue !== undefined) {
    return currentValue;
  }
  if (mockArgs && mockArgs.with) {
    if (fieldArgs) {
      try {
        return Mustache.render(mockArgs.with, fieldArgs);
      } catch (e) {
        logger.error(new AntError(
          'Coould not renderize field template',
          e
        ));
      }
    } else {
      return mockArgs.with;
    }
  }
  return null;
}

module.exports = mock;
