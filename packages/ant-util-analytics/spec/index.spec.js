/**
 * @fileoverview Tests for index.js file.
 */

describe('index.js', () => {
  test('should export "Analytics" module', () => {
    expect(require('../').Analytics.constructor.name).toEqual('Analytics');
  });
});
