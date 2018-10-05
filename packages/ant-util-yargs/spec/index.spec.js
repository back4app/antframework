/**
 * @fileoverview Tests for index.js file.
 */

describe('index.js', () => {
  test('should export "yargsHelper" module', () => {
    expect(require('../').yargsHelper).toEqual(
      require('../lib/yargsHelper')
    );
  });
});
