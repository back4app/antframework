/**
 * @fileoverview Tests for index.js file.
 */

describe('index.js', () => {
  test('should export "rxjsHelper" module', () => {
    expect(require('../').rxjsHelper).toEqual(
      require('../lib/rxjsHelper')
    );
  });
});
