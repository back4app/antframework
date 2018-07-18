/**
 * @fileoverview Tests for lib/util/index.js file.
 */

describe('lib/util/index.js', () => {
  test('should export "logger" singleton instance', () => {
    expect(require('../../../lib/util').logger).toEqual(
      require('../../../lib/util/logger')
    );
  });
});
