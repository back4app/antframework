/**
 * @fileoverview Tests for lib/index.js file.
 */

const util = require('../');
const AntError = require('../lib/AntError');
const logger = require('../lib/logger');

describe('lib/index.js', () => {
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
});
