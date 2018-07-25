/**
 * @fileoverview Tests for lib/util/index.js file.
 */

const util = require('../../../lib/util');
const AntError = require('../../../lib/util/AntError');
const logger = require('../../../lib/util/logger');
const yargsHelper = require('../../../lib/util/yargsHelper');

describe('lib/util/index.js', () => {
  test('should export "AntError" class', () => {
    expect(util.AntError).toEqual(
      AntError
    );
  });

  test('should export "logger" singleton instance', () => {
    expect(util.logger).toEqual(
      logger
    );
  });

  test('should export "yargsHelper" module', () => {
    expect(util.yargsHelper).toEqual(
      yargsHelper
    );
  });
});
